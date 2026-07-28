/**
 * @fileoverview Hybrid Fluid-Light Transport Engine.
 *
 * This module implements a simulation of light as a fluid substance possessing
 * both energy (colour) and momentum (direction). It employs a hybrid approach:
 *
 * 1. INJECTION (Ray Tracing): We use stochastic ray tracing to probe the
 *    geometric scene and "inject" photons into a 2D screen-space grid.
 * 2. PROPAGATION (Fluid Dynamics): Once injected, the light is handed over to
 *    a Cellular Automata (CA) solver. The light advects (flows) and diffuses
 *    across the screen based on local surface roughness and depth topology.
 *
 * This technique creates soft shadows, colour bleeding, and ambient occlusion
 * purely through 2D pixel-neighbour interactions, avoiding expensive global
 * illumination calculations.
 */
"use strict";

/**
 * Configuration constants for the simulation.
 * @const
 */
const CONFIG = {
  /**
   * Resolution downsampling factor.
   * To maintain 60 FPS, we downsample the window resolution.
   * A 1920px width becomes a ~384px width simulation grid.
   * @type {number}
   */
  DOWNSAMPLE: 5,

  /**
   * Size of a tile in pixels (width and height).
   * Physics is activated in 4x4 "Blocks" (Tiles).
   * @type {number}
   */
  TILE_SIZE: 4,

  /**
   * Maximum time allowed for physics calculations per frame (in milliseconds).
   * If calculations exceed this, the loop aborts to ensure the frame renders.
   * @type {number}
   */
  TIMESTEP_BUDGET_MS: 14,

  /**
   * Energy lost to entropy per tick.
   * @type {number}
   */
  DISSIPATION: 0.97,

  /**
   * Momentum decay factor (viscosity).
   * How quickly light stops "flowing".
   * @type {number}
   */
  MOMENTUM_DECAY: 0.92,

  /**
   * Magnitude of flow per tick.
   * @type {number}
   */
  ADVECTION_STRENGTH: 3.0,

  /**
   * Virtual camera aperture.
   * @type {number}
   */
  EXPOSURE: 2.5,

  /**
   * Monitor gamma correction.
   * @type {number}
   */
  GAMMA: 2.2,
  SCENE_URL: '/_file/assets/scene.json',
};

// Expose CONFIG to window for OJS interaction
if (typeof window !== 'undefined') {
  const userConfig = window.CONFIG || {};
  const finalSceneUrl = userConfig.SCENE_URL || '/_file/assets/scene.json';

  window.CONFIG = Object.assign({}, CONFIG, userConfig);
  window.CONFIG.SCENE_URL = finalSceneUrl;
}

/**
 * Memory layout offsets for the Structure of Arrays (SoA).
 * Access a pixel's property by: index = (y * width + x) * STRIDE + OFFSET.
 * @enum {number}
 */
const FIELD = {
  R: 0,
  G: 1,
  B: 2, // Spectral Energy (Colour)
  VEL_X: 4,
  VEL_Y: 5, // Momentum Vector (Flow direction)
  ROUGHNESS: 6, // Surface material property (Friction)
  DEPTH: 7, // Distance from camera (Topology)
  OBJECT_ID: 11, // Discrete ID to prevent bleeding across distinct objects
  SLEEP_TIMER: 12, // Activity monitor for optimisation
};

/**
 * Total number of floats per pixel in the lattice.
 * @const {number}
 */
const STRIDE = 14;

// Canvas Context configuration
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', {
  alpha: false,
  willReadFrequently: true,
});

// ==========================================
// SYSTEM STATE
// ==========================================

/**
 * Internal resolution dimensions.
 * @type {{W: number, H: number}}
 */
let RESOLUTION = {W: 0, H: 0};

/**
 * Total number of pixels in the simulation grid.
 * @type {number}
 */
let TOTAL_PIXELS = 0;

/**
 * Number of tiles horizontally.
 * @type {number}
 */
let TILES_X = 0;

/**
 * Number of tiles vertically.
 * @type {number}
 */
let TILES_Y = 0;

/**
 * Size of the bitmask array.
 * @type {number}
 */
let MASK_SIZE = 0;

/**
 * The global state object containing simulation data and metadata.
 */
const State = {
  /**
   * The single buffer containing the entire universe's state.
   * Allocated in bootSystem().
   * @type {Float32Array|null}
   */
  lattice: null,

  /**
   * Persistent display buffer to avoid expensive read-backs.
   * @type {ImageData|null}
   */
  displayImage: null,

  /**
   * Bitmask tracking active regions for the current frame.
   * @type {Uint32Array|null}
   */
  maskRead: null,

  /**
   * Bitmask tracking active regions for the next frame.
   * @type {Uint32Array|null}
   */
  maskWrite: null,

  /**
   * Camera position and orientation.
   * @type {{x: number, y: number, z: number, yaw: number, pitch: number}}
   */
  cam: {x: 0, y: 0.5, z: -3.0, yaw: 0, pitch: 0},

  /**
   * User input state.
   */
  input: {keys: {}, dragging: false, lastMouse: {x: 0, y: 0}},

  /**
   * Current view mode.
   * 0: Composite Output
   * 1: Active Tile Map
   * 2: Velocity Vector Field
   * @type {number}
   */
  viewMode: 0,

  /**
   * Performance profiling data.
   */
  profiler: {
    lastTime: 0,
    frameCount: 0,
    accumulatedTime: 0,
    accumulatedTiles: 0,
    dom: {
      fps: document.getElementById('fps'),
      physTime: document.getElementById('physTime'),
      loadBar: document.getElementById('loadBar'),
      activeBlocks: document.getElementById('activeBlocks'),
      budget: document.getElementById('budget'),
      viewMode: document.getElementById('viewModeDisplay'),
      resDisplay: document.getElementById('resDisplay'),
    },
  },
};

// ==========================================
// INITIALISATION
// ==========================================

/**
 * Initialises the simulation by allocating memory and computing grid dimensions.
 * This function performs critical setup:
 * 1. Calculates internal resolution based on window size and downsampling
 * 2. Resizes canvas to match resolution
 * 3. Computes tile grid dimensions for spatial optimisation
 * 4. Allocates typed arrays for state storage
 * 5. Creates image buffer for rendering
 * 
 * @function bootSystem
 * @fires window#resize - Automatically called when window is resized (debounced)
 * @modifies {RESOLUTION} - Updates global resolution dimensions
 * @modifies {State.lattice} - Allocates new Float32Array for simulation state
 * @modifies {State.maskRead} - Allocates bitmask for active tile tracking
 * @modifies {State.maskWrite} - Allocates double-buffered bitmask
 * @modifies {State.displayImage} - Creates ImageData for rendering
 * 
 * @example
 * // Called automatically on page load
 * window.addEventListener('load', bootSystem);
 * 
 * @example
 * // Manually reinitialise after config change
 * CONFIG.DOWNSAMPLE = 8;
 * bootSystem();
 */
function bootSystem() {
  // 1. Determine base dimensions from container
  const baseW = window.innerWidth;
  const baseH = window.innerHeight;
  
  // 2. Calculate internal resolution as multiples of TILE_SIZE (4)
  // This prevents black bars at the edges caused by integer division in loops
  RESOLUTION.W = Math.floor(baseW / (CONFIG.DOWNSAMPLE * CONFIG.TILE_SIZE)) * CONFIG.TILE_SIZE;
  RESOLUTION.H = Math.floor(baseH / (CONFIG.DOWNSAMPLE * CONFIG.TILE_SIZE)) * CONFIG.TILE_SIZE;
  
  // Enforce minimums
  RESOLUTION.W = Math.max(CONFIG.TILE_SIZE * 10, RESOLUTION.W);
  RESOLUTION.H = Math.max(CONFIG.TILE_SIZE * 10, RESOLUTION.H);

  // 3. Set canvas buffer size (internal resolution)
  canvas.width = RESOLUTION.W;
  canvas.height = RESOLUTION.H;

  // 3. Derive grid constants
  TOTAL_PIXELS = RESOLUTION.W * RESOLUTION.H;
  TILES_X = Math.ceil(RESOLUTION.W / CONFIG.TILE_SIZE);
  TILES_Y = Math.ceil(RESOLUTION.H / CONFIG.TILE_SIZE);
  const totalTiles = TILES_X * TILES_Y;

  // 4. Calculate bitmask size (32 tiles fit into one integer)
  MASK_SIZE = Math.ceil(totalTiles / 32);

  // 5. Allocate Typed Arrays (The "Heap")
  State.lattice = new Float32Array(TOTAL_PIXELS * STRIDE);
  State.maskRead = new Uint32Array(MASK_SIZE);
  State.maskWrite = new Uint32Array(MASK_SIZE);

  // 6. Allocate Display Buffer
  State.displayImage = ctx.createImageData(RESOLUTION.W, RESOLUTION.H);

  // 7. Update UI
  if (State.profiler.dom.resDisplay) {
    State.profiler.dom.resDisplay.innerText =
        `${RESOLUTION.W}x${RESOLUTION.H}`;
  }
}

/**
 * Debounce utility to limit function execution rate.
 * @param {Function} func The function to debounce.
 * @param {number} wait The delay in milliseconds.
 * @return {Function} The debounced function.
 */
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}

// Debounced resize handler with state preservation check
let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

window.addEventListener('resize', debounce(() => {
  if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
    bootSystem();
  }
}, 500));

// ==========================================
// MATHEMATICS & GEOMETRY
// ==========================================

/**
 * Mathematical utility functions.
 */
const MathLib = {
  seed: 1337,

  /**
   * Fast pseudo-random number generator using Linear Congruential Generator (LCG).
   * Provides deterministic random values based on internal seed state.
   * Uses the same parameters as the POSIX rand48 family.
   * 
   * @memberof MathLib
   * @returns {number} Pseudo-random float in range [0, 1)
   * 
   * @example
   * // Generate random positions
   * const x = MathLib.nextFloat() * width;
   * const y = MathLib.nextFloat() * height;
   * 
   * @algorithm
   * LCG formula: seed = (a × seed + c) mod m
   * Where: a = 1664525, c = 1013904223, m = 2³²
   * Output: seed / 2³² to normalise to [0, 1)
   * 
   * @performance O(1) - Single multiply-add operation
   * @deterministic true - Same seed produces same sequence
   */
  nextFloat: function() {
    this.seed = (this.seed * 1664525 + 1013904223) | 0;
    return (this.seed >>> 0) / 4294967296;
  },

  /**
   * Poincaré Ball Projection.
   * Compresses infinite Euclidean distance into a 0.0-1.0 range.
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @return {Array<number>} [x, y, z] projected coordinates.
   */
  toHyperbolic: function(x, y, z) {
    const len = Math.sqrt(x * x + y * y + z * z);
    const scale = 1.0 / (1.0 + len * 0.15);
    return [x * scale, y * scale, z * scale];
  },

  /**
   * ACES (Academy Colour Encoding System) tone mapping curve.
   * Maps High Dynamic Range (HDR) values to Low Dynamic Range (LDR)
   * for display on standard monitors. Preserves colour relationships
   * and provides smooth highlight rolloff.
   * 
   * @memberof MathLib
   * @param {number} x - Input HDR colour value (unbounded range)
   * @returns {number} Tone-mapped LDR value (typically [0, 1])
   * 
   * @example
   * // Tone map HDR pixel values
   * const hdrColour = 5.2;  // Bright light source
   * const ldrColour = MathLib.aces(hdrColour);  // ~0.95
   * 
   * @algorithm
   * Rational function approximation:
   * f(x) = (x(ax + b)) / (x(cx + d) + e)
   * Constants tuned for perceptually pleasing results
   * 
   * @see {@link https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/}
   */
  aces: function(x) {
    const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
    return (x * (a * x + b)) / (x * (c * x + d) + e);
  },
};

/**
 * Scene definition and ray tracing logic.
 * Populated via asynchronous fetch.
 */
const Scene = {
  spheres: [], // Empty init, populated by Data Flow
  activeLight: null, // Cached light source

  /**
   * Updates the cached active light source.
   * Should be called when the scene loads or changes.
   */
  cacheLightSource: function() {
    if (!this.spheres || this.spheres.length === 0) return;
    this.activeLight = this.spheres.find((s) => s.em > 0) ||
        this.spheres[this.spheres.length - 1];
  },

  /**
   * Performs ray-sphere intersection using geometric algebra.
   * Uses the discriminant method to solve the quadratic equation
   * formed by substituting the ray equation into the sphere equation.
   * 
   * @memberof Scene
   * @param {Array<number>} ro - Ray origin [x, y, z]
   * @param {Array<number>} rd - Ray direction [x, y, z], should be normalised
   * @returns {{t: number, obj: Object|null}} Intersection result
   * @property {number} t - Distance along ray to intersection (1e9 if no hit)
   * @property {Object|null} obj - The sphere object that was hit, or null
   * 
   * @example
   * const ray = {origin: [0, 0, -5], direction: [0, 0, 1]};
   * const hit = Scene.trace(ray.origin, ray.direction);
   * if (hit.obj) {
   *   console.log(`Hit sphere at distance ${hit.t}`);
   * }
   * 
   * @algorithm
   * Solves: |P(t) - C|² = r²
   * Where: P(t) = O + tD (ray equation)
   * Expands to: at² + bt + c = 0
   * Discriminant: Δ = b² - 4ac
   * If Δ > 0: two intersections (entry and exit)
   * Takes nearest positive t value
   */
  trace: function(ro, rd) {
    let tMin = 1e9;
    let hitObj = null;

    for (let i = 0; i < this.spheres.length; i++) {
      const s = this.spheres[i];
      const ocX = ro[0] - s.x;
      const ocY = ro[1] - s.y;
      const ocZ = ro[2] - s.z;
      const b = ocX * rd[0] + ocY * rd[1] + ocZ * rd[2];
      const c = ocX * ocX + ocY * ocY + ocZ * ocZ - s.r * s.r;
      const d = b * b - c;

      if (d > 0) {
        const t = -b - Math.sqrt(d);
        if (t > 0.01 && t < tMin) {
          tMin = t;
          hitObj = s;
        }
      }
    }
    return {t: tMin, obj: hitObj};
  },

  /**
   * Computes lighting and material properties at a ray intersection point.
   * Implements basic Lambertian diffuse shading with distance attenuation.
   * 
   * @memberof Scene
   * @param {{t: number, obj: Object|null}} hit - Intersection data from trace()
   * @param {Array<number>} ro - Ray origin [x, y, z]
   * @param {Array<number>} rd - Ray direction [x, y, z]
   * @returns {Object|null} Shading information or null if no hit
   * @property {Array<number>} albedo - Surface colour [r, g, b]
   * @property {Array<number>} emission - Emitted light [r, g, b]
   * @property {Array<number>} normal - Surface normal [x, y, z]
   * @property {Array<number>} position - World-space position [x, y, z]
   * @property {number} depth - Distance from camera
   * @property {number} diffuse - Lambertian diffuse term (N·L)
   * @property {number} falloff - Distance-based attenuation
   * 
   * @example
   * const hit = Scene.trace(ro, rd);
   * const shading = Scene.shade(hit, ro, rd);
   * if (shading) {
   *   // Use shading.albedo, shading.emission, etc.
   *   const finalColour = shading.albedo.map((c, i) => 
   *     c * shading.diffuse * shading.falloff + shading.emission[i]
   *   );
   * }
   */
  shade: function(hit, ro, rd) {
    if (!hit.obj) return null;

    const P = [
      ro[0] + rd[0] * hit.t,
      ro[1] + rd[1] * hit.t,
      ro[2] + rd[2] * hit.t,
    ];

    const nx = P[0] - hit.obj.x;
    const ny = P[1] - hit.obj.y;
    const nz = P[2] - hit.obj.z;
    const nl = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
    const N = [nx * nl, ny * nl, nz * nl];

    // Use cached light source to avoid array search per pixel
    const light = this.activeLight;

    const ldX = light.x - P[0];
    const ldY = light.y - P[1];
    const ldZ = light.z - P[2];
    const distSq = ldX * ldX + ldY * ldY + ldZ * ldZ;
    const dist = Math.sqrt(distSq);

    const diff = Math.max(0,
        N[0] * (ldX / dist) +
        N[1] * (ldY / dist) +
        N[2] * (ldZ / dist));

    const emission = hit.obj.em > 0 ?
        [hit.obj.em, hit.obj.em, hit.obj.em] :
        [
          (light.em / distSq) * diff,
          (light.em / distSq) * diff,
          (light.em / distSq) * diff,
        ];

    return {
      albedo: hit.obj.col,
      emission: emission,
      N: N,
      P: P,
      id: hit.obj.id,
      rough: hit.obj.rough,
    };
  },
};

// ==========================================
// PHYSICS ENGINE (THE SOLVER)
// ==========================================

/**
 * Marks a specific spatial region (tile) as active.
 * This ensures the physics solver will process this region in the next frame.
 * @param {number} tx Tile X index.
 * @param {number} ty Tile Y index.
 */
function activateSpatialRegion(tx, ty) {
  if (tx < 0 || tx >= TILES_X || ty < 0 || ty >= TILES_Y) return;
  const tileIdx = ty * TILES_X + tx;
  const arrIdx = tileIdx >>> 5;
  // Set bit in read mask to keep current frame alive if needed,
  // and write mask for next frame.
  State.maskRead[arrIdx] |= 1 << (tileIdx & 31);
  State.maskWrite[arrIdx] |= 1 << (tileIdx & 31);
}

/**
 * Evolves the simulation state by one timestep.
 * Uses Cellular Automata to flow light energy from pixel to pixel.
 */
function evolveSimulation() {
  const perfStart = performance.now();
  let frameActiveTiles = 0;

  // Clear the "Next State" mask
  State.maskWrite.fill(0);

  // Iterate over bitmasks (Sparse Loop)
  for (let i = 0; i < MASK_SIZE; i++) {
    const block = State.maskRead[i];
    if (block === 0) continue; // Skip empty space

    // Budget check
    if (i % 10 === 0 &&
        performance.now() - perfStart > CONFIG.TIMESTEP_BUDGET_MS) {
      break;
    }

    for (let b = 0; b < 32; b++) {
      if ((block & (1 << b)) !== 0) {
        const globalTileIdx = (i << 5) + b;
        const tx = globalTileIdx % TILES_X;
        const ty = (globalTileIdx / TILES_X) | 0;
        const startX = tx * CONFIG.TILE_SIZE;
        const startY = ty * CONFIG.TILE_SIZE;
        let tileIsAlive = false;

        for (let py = startY; py < startY + CONFIG.TILE_SIZE; py++) {
          if (py >= RESOLUTION.H) continue;
          for (let px = startX; px < startX + CONFIG.TILE_SIZE; px++) {
            if (px >= RESOLUTION.W) continue;

            const ptr = (py * RESOLUTION.W + px) * STRIDE;

            // Check if pixel is asleep
            if (State.lattice[ptr + FIELD.SLEEP_TIMER] < 1.0) {
              let vx = State.lattice[ptr + FIELD.VEL_X];
              let vy = State.lattice[ptr + FIELD.VEL_Y];
              const energy = State.lattice[ptr] +
                             State.lattice[ptr + 1] +
                             State.lattice[ptr + 2];

              // Micro-culling
              if (energy < 0.001 && Math.abs(vx) + Math.abs(vy) < 0.001) {
                State.lattice[ptr + FIELD.SLEEP_TIMER] = 1.0;
                continue;
              }

              // Advection step
              const randX = MathLib.nextFloat() - 0.5;
              const randY = MathLib.nextFloat() - 0.5;
              const dx = Math.round(
                  vx * CONFIG.ADVECTION_STRENGTH + randX * 0.5);
              const dy = Math.round(
                  vy * CONFIG.ADVECTION_STRENGTH + randY * 0.5);
              const nx = px + dx;
              const ny = py + dy;

              if (nx >= 0 && nx < RESOLUTION.W &&
                  ny >= 0 && ny < RESOLUTION.H) {
                const nPtr = (ny * RESOLUTION.W + nx) * STRIDE;
                const depthDiff = Math.abs(
                    State.lattice[ptr + FIELD.DEPTH] -
                    State.lattice[nPtr + FIELD.DEPTH]);

                if (depthDiff < 0.5) {
                  // Continuous surface
                  const roughness = State.lattice[ptr + FIELD.ROUGHNESS];
                  if (State.lattice[nPtr + FIELD.ROUGHNESS] > 0.5) {
                    vx = 0; vy = 0;
                    State.lattice[ptr + FIELD.VEL_X] *= -0.5;
                    State.lattice[ptr + FIELD.VEL_Y] *= -0.5;
                  }

                  const baseFlow = roughness < 0.1 ? 0.9 : 0.45;
                  const flowRate = baseFlow * (1.0 - roughness);
                  const energyFlow = baseFlow * (1.0 - roughness * 0.5);

                  const eTransfer = energyFlow * CONFIG.DISSIPATION;
                  const mTransfer = flowRate * CONFIG.DISSIPATION;

                  State.lattice[nPtr + 0] +=
                      State.lattice[ptr + 0] * eTransfer;
                  State.lattice[nPtr + 1] +=
                      State.lattice[ptr + 1] * eTransfer;
                  State.lattice[nPtr + 2] +=
                      State.lattice[ptr + 2] * eTransfer;

                  State.lattice[nPtr + 4] += vx * mTransfer * 0.9;
                  State.lattice[nPtr + 5] += vy * mTransfer * 0.9;

                  State.lattice[ptr + 0] *= 1 - energyFlow;
                  State.lattice[ptr + 1] *= 1 - energyFlow;
                  State.lattice[ptr + 2] *= 1 - energyFlow;

                  const localDrag = CONFIG.MOMENTUM_DECAY *
                      (1.0 - roughness * 0.5);
                  State.lattice[ptr + 4] *= localDrag;
                  State.lattice[ptr + 5] *= localDrag;

                  State.lattice[nPtr + FIELD.SLEEP_TIMER] = 0.0;
                  activateSpatialRegion(
                      (nx / CONFIG.TILE_SIZE) | 0,
                      (ny / CONFIG.TILE_SIZE) | 0);
                } else {
                  // Air gap
                  const airFlow = 0.15 * CONFIG.DISSIPATION;
                  State.lattice[nPtr + 0] +=
                      State.lattice[ptr + 0] * airFlow;
                  State.lattice[nPtr + 1] +=
                      State.lattice[ptr + 1] * airFlow;
                  State.lattice[nPtr + 2] +=
                      State.lattice[ptr + 2] * airFlow;

                  State.lattice[ptr + 0] *= 1 - airFlow;
                  State.lattice[ptr + 1] *= 1 - airFlow;
                  State.lattice[ptr + 2] *= 1 - airFlow;

                  State.lattice[ptr + FIELD.VEL_X] = 0.0;
                  State.lattice[ptr + FIELD.VEL_Y] = 0.0;

                  State.lattice[nPtr + FIELD.SLEEP_TIMER] = 0.0;
                  activateSpatialRegion(
                      (nx / CONFIG.TILE_SIZE) | 0,
                      (ny / CONFIG.TILE_SIZE) | 0);
                }
              } else {
                // Screen boundary
                State.lattice[ptr + 0] *= 0.8;
                State.lattice[ptr + 4] = 0;
                State.lattice[ptr + 5] = 0;
                State.lattice[ptr + FIELD.SLEEP_TIMER] = 1.0;
              }

              State.lattice[ptr + FIELD.SLEEP_TIMER] += 0.02;
              if (State.lattice[ptr + FIELD.SLEEP_TIMER] < 1.0) {
                tileIsAlive = true;
              }
            }
          }
        }

        if (tileIsAlive) {
          frameActiveTiles++;
          State.maskWrite[i] |= 1 << b;
        }
      }
    }
  }

  const temp = State.maskRead;
  State.maskRead = State.maskWrite;
  State.maskWrite = temp;

  State.profiler.accumulatedTime += performance.now() - perfStart;
  State.profiler.accumulatedTiles += frameActiveTiles;
}

// ==========================================
// MAIN SIMULATION LOOP
// ==========================================

/**
 * The main game loop. Handles input, physics, and rendering.
 */
function mainSimulationLoop() {
  if (!State.lattice) {
    requestAnimationFrame(mainSimulationLoop);
    return;
  }

  if (handleInput()) {
    State.lattice.fill(0);
    State.maskRead.fill(0);
    State.maskWrite.fill(0);
  }

  const W = RESOLUTION.W;
  const H = RESOLUTION.H;
  const gridW = CONFIG.TILE_SIZE;
  const gridH = CONFIG.TILE_SIZE;
  const cols = (W / gridW) | 0;
  const rows = (H / gridH) | 0;
  const invAlpha = State.input.dragging ? 0.5 : 0.94;

  const cx = Math.cos(State.cam.yaw);
  const sx = Math.sin(State.cam.yaw);
  const cp = Math.cos(State.cam.pitch);
  const sp = Math.sin(State.cam.pitch);
  const camBasis = {
    rx: cx, ry: 0, rz: -sx,
    ux: sx * sp, uy: cp, uz: cx * sp,
    fx: sx * cp, fy: -sp, fz: cx * cp,
  };

  // Pre-fetch light source for the frame
  const light = Scene.activeLight;

  // Ray Injection Phase
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const ox = (MathLib.nextFloat() * gridW) | 0;
      const oy = (MathLib.nextFloat() * gridH) | 0;
      const x = gx * gridW + ox;
      const y = gy * gridH + oy;
      const ptr = (y * W + x) * STRIDE;

      const uvX = ((x / W) * 2 - 1) * (W / H);
      const uvY = 1 - (y / H) * 2;
      const rLenInv = 1.0 / Math.sqrt(uvX * uvX + uvY * uvY + 1.0);
      const ldx = uvX * rLenInv;
      const ldy = uvY * rLenInv;
      const ldz = 1.0 * rLenInv;

      const rxf = ldx * camBasis.rx + ldy * camBasis.ux + ldz * camBasis.fx;
      const ryf = ldx * camBasis.ry + ldy * camBasis.uy + ldz * camBasis.fy;
      const rzf = ldx * camBasis.rz + ldy * camBasis.uz + ldz * camBasis.fz;

      const hit = Scene.trace(
          [State.cam.x, State.cam.y, State.cam.z],
          [rxf, ryf, rzf],
      );
      const shader = Scene.shade(
          hit,
          [State.cam.x, State.cam.y, State.cam.z],
          [rxf, ryf, rzf],
      );

      if (State.lattice[ptr + FIELD.OBJECT_ID] !==
          (shader ? shader.id : -1)) {
        State.lattice[ptr] = 0;
        State.lattice[ptr + 1] = 0;
        State.lattice[ptr + 2] = 0;
        State.lattice[ptr + 4] = 0;
        State.lattice[ptr + 5] = 0;
        State.lattice[ptr + FIELD.OBJECT_ID] = shader ? shader.id : -1;
        State.lattice[ptr + FIELD.SLEEP_TIMER] = 1.0;
      }

      if (shader) {
        const hyp = MathLib.toHyperbolic(
            shader.P[0], shader.P[1], shader.P[2]);
        State.lattice[ptr + FIELD.DEPTH] = Math.sqrt(
            hyp[0] * hyp[0] + hyp[1] * hyp[1] + hyp[2] * hyp[2]);
        State.lattice[ptr + FIELD.ROUGHNESS] = shader.rough;

        const ir = shader.emission[0] * shader.albedo[0];
        const ig = shader.emission[1] * shader.albedo[1];
        const ib = shader.emission[2] * shader.albedo[2];

        // Direct write for light source (ID 5)
        if (shader.id === 5) {
          State.lattice[ptr] = ir;
          State.lattice[ptr + 1] = ig;
          State.lattice[ptr + 2] = ib;
          State.lattice[ptr + FIELD.SLEEP_TIMER] = 0.0;
          activateSpatialRegion(
              (x / CONFIG.TILE_SIZE) | 0,
              (y / CONFIG.TILE_SIZE) | 0,
          );
          continue;
        }

        const ldX = light.x - shader.P[0];
        const ldZ = light.z - shader.P[2];
        const lenL = Math.sqrt(ldX * ldX + ldZ * ldZ) + 1e-6;
        const impulse = Math.min(shader.emission[0] * 0.01, 0.05);

        State.lattice[ptr + FIELD.VEL_X] += (ldX / lenL) * impulse;
        State.lattice[ptr + FIELD.VEL_Y] += (ldZ / lenL) * impulse;

        State.lattice[ptr] =
            State.lattice[ptr] * invAlpha + ir * 0.1;
        State.lattice[ptr + 1] =
            State.lattice[ptr + 1] * invAlpha + ig * 0.1;
        State.lattice[ptr + 2] =
            State.lattice[ptr + 2] * invAlpha + ib * 0.1;

        State.lattice[ptr + FIELD.SLEEP_TIMER] = 0.0;
        activateSpatialRegion(
            (x / CONFIG.TILE_SIZE) | 0,
            (y / CONFIG.TILE_SIZE) | 0,
        );
      } else {
        State.lattice[ptr] *= 0.8;
        State.lattice[ptr + FIELD.VEL_X] = 0;
        State.lattice[ptr + FIELD.VEL_Y] = 0;
        State.lattice[ptr + FIELD.SLEEP_TIMER] = 1.0;
      }
    }
  }

  // Fluid Physics Phase
  evolveSimulation();

  // Display Phase: Render to persistent offscreen buffer
  const imageData = State.displayImage;
  const data = imageData.data;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ptr = (y * W + x) * STRIDE;
      const pIdx = (y * W + x) * 4;
      let r = 0;
      let g = 0;
      let b = 0;

      if (State.viewMode === 0) {
        r = MathLib.aces(State.lattice[ptr] * CONFIG.EXPOSURE);
        g = MathLib.aces(State.lattice[ptr + 1] * CONFIG.EXPOSURE);
        b = MathLib.aces(State.lattice[ptr + 2] * CONFIG.EXPOSURE);
      } else if (State.viewMode === 1) {
        const tx = (x / CONFIG.TILE_SIZE) | 0;
        const ty = (y / CONFIG.TILE_SIZE) | 0;
        const tIdx = ty * TILES_X + tx;
        if ((State.maskRead[tIdx >> 5] & (1 << (tIdx & 31))) !== 0) {
          r = 0;
          g = 0.15;
          b = 0;
        }
        r += State.lattice[ptr];
      } else if (State.viewMode === 2) {
        r = Math.abs(State.lattice[ptr + FIELD.VEL_X]);
        b = Math.abs(State.lattice[ptr + FIELD.VEL_Y]);
      }

      const dither = (MathLib.nextFloat() - 0.5) * (1.0 / 255.0);
      data[pIdx] = Math.min(255,
          Math.pow(r + dither, 1.0 / CONFIG.GAMMA) * 255);
      data[pIdx + 1] = Math.min(255,
          Math.pow(g + dither, 1.0 / CONFIG.GAMMA) * 255);
      data[pIdx + 2] = Math.min(255,
          Math.pow(b + dither, 1.0 / CONFIG.GAMMA) * 255);
      data[pIdx + 3] = 255;
    }
  }
  // Blit the offscreen buffer to the canvas
  ctx.putImageData(imageData, 0, 0);

  updateTelemetry();
  requestAnimationFrame(mainSimulationLoop);
}

// ==========================================
// INPUT & UTILITIES
// ==========================================

/**
 * Handles user input to update the camera position.
 * @return {boolean} True if the camera moved, false otherwise.
 */
function handleInput() {
  let moved = false;
  const speed = 0.05;
  const rot = 0.02;
  const fx = Math.sin(State.cam.yaw);
  const fz = Math.cos(State.cam.yaw);
  const rx = Math.cos(State.cam.yaw);
  const rz = -Math.sin(State.cam.yaw);

  if (State.input.keys['w']) {
    State.cam.x += fx * speed;
    State.cam.z += fz * speed;
    moved = true;
  }
  if (State.input.keys['s']) {
    State.cam.x -= fx * speed;
    State.cam.z -= fz * speed;
    moved = true;
  }
  if (State.input.keys['a']) {
    State.cam.x -= rx * speed;
    State.cam.z -= rz * speed;
    moved = true;
  }
  if (State.input.keys['d']) {
    State.cam.x += rx * speed;
    State.cam.z += rz * speed;
    moved = true;
  }
  if (State.input.keys['arrowleft']) {
    State.cam.yaw -= rot;
    moved = true;
  }
  if (State.input.keys['arrowright']) {
    State.cam.yaw += rot;
    moved = true;
  }
  if (State.input.keys['arrowup']) {
    State.cam.pitch += rot;
    moved = true;
  }
  if (State.input.keys['arrowdown']) {
    State.cam.pitch -= rot;
    moved = true;
  }
  return moved;
}

/**
 * Updates the on-screen telemetry display.
 */
function updateTelemetry() {
  const now = performance.now();
  if (now - State.profiler.lastTime >= 1000) {
    const avgTiles = Math.round(
        State.profiler.accumulatedTiles / State.profiler.frameCount,
    );
    const avgTime = (
      State.profiler.accumulatedTime / State.profiler.frameCount
    ).toFixed(2);
    const totalTiles = TILES_X * TILES_Y;
    const sparsity = totalTiles > 0 ?
        ((1.0 - (avgTiles / totalTiles)) * 100).toFixed(1) :
        0;

    if (State.profiler.dom.fps) {
      State.profiler.dom.fps.innerText = `${State.profiler.frameCount} FPS`;
      State.profiler.dom.activeBlocks.innerText = avgTiles;
      State.profiler.dom.physTime.innerText = `${avgTime}ms`;
      if (State.profiler.dom.budget) {
        State.profiler.dom.budget.innerText = `${sparsity}%`;
      }

      const loadPct = (avgTime / CONFIG.TIMESTEP_BUDGET_MS) * 100;
      State.profiler.dom.loadBar.style.width = Math.min(loadPct, 100) + '%';
      State.profiler.dom.loadBar.style.background =
          loadPct < 80 ? '#28a745' : loadPct < 100 ? '#ffc107' : '#dc3545';
    }

    State.profiler.frameCount = 0;
    State.profiler.accumulatedTime = 0;
    State.profiler.accumulatedTiles = 0;
    State.profiler.lastTime = now;
  }
  State.profiler.frameCount++;
}

canvas.addEventListener('mousedown', (e) => {
  State.input.dragging = true;
  State.input.lastMouse = {x: e.clientX, y: e.clientY};
});

window.addEventListener('mouseup', () => (State.input.dragging = false));

window.addEventListener('mousemove', (e) => {
  if (!State.input.dragging) return;
  const dx = e.clientX - State.input.lastMouse.x;
  const dy = e.clientY - State.input.lastMouse.y;
  State.input.lastMouse = {x: e.clientX, y: e.clientY};

  if (e.button === 0) {
    State.cam.yaw += dx * 0.005;
    State.cam.pitch -= dy * 0.005;
    State.lattice.fill(0);
    State.maskRead.fill(0);
  } else if (e.button === 2) {
    // Dynamic light movement: find the light object (id 5) and move it
    const light = Scene.spheres.find((s) => s.id === 5);
    if (light) {
      light.x += dx * 0.02;
      light.y -= dy * 0.02;
      State.lattice.fill(0);
      State.maskRead.fill(0);
    }
  }
});

window.addEventListener('keydown', (e) =>
  (State.input.keys[e.key.toLowerCase()] = true));

window.addEventListener('keyup', (e) =>
  (State.input.keys[e.key.toLowerCase()] = false));

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    State.viewMode = (State.viewMode + 1) % 3;
    const modes = [
      'Composite Output',
      'Active Tile Map',
      'Velocity Vector Field',
    ];
    if (State.profiler.dom.viewMode) {
      State.profiler.dom.viewMode.innerText = modes[State.viewMode];
    }
  }
});

// ==========================================
// ASYNCHRONOUS DATA FLOW
// ==========================================

/**
 * Bootstraps the engine by fetching configuration data.
 */
async function initialiseEngine() {
  const uiStatus = document.getElementById('statusIndicator');
  const sourceDisplay = document.getElementById('sceneSource');
  try {
    let sceneData;
    if (window.CONFIG && window.CONFIG.SCENE_DATA) {
      sceneData = window.CONFIG.SCENE_DATA;
      if (sourceDisplay) sourceDisplay.textContent = 'Inline Scene Data';
    } else {
      if (sourceDisplay) sourceDisplay.textContent = window.CONFIG.SCENE_URL;
      const response = await fetch(window.CONFIG.SCENE_URL);
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }
      sceneData = await response.json();
    }

    // 3. HYDRATE: Populate the Engine State
    Scene.spheres = sceneData || [];
    Scene.cacheLightSource(); // Cache the light for performance

    // 4. BOOT: Start the Physics Loop
    if (uiStatus) {
      uiStatus.innerText = '● ACTIVE';
      uiStatus.style.color = '#28a745'; // Green
    }

    // Small delay to ensure canvas is ready in iframes
    setTimeout(() => {
      bootSystem();
      requestAnimationFrame(mainSimulationLoop);
    }, 100);
    // 5. Connect UI Controls
    setupUIControlListeners();
  } catch (error) {
    console.error('Data Flow Interruption:', error);
    if (uiStatus) {
      uiStatus.innerText = '● DATA ERROR (See Console)';
      uiStatus.style.color = '#dc3545'; // Red
    }
  }
}

/**
 * Connects HTML sliders to the engine configuration.
 */
function setupUIControlListeners() {
  const sliders = {
    DISSIPATION: document.getElementById('dissipationSlider'),
    ADVECTION_STRENGTH: document.getElementById('advectionSlider'),
    MOMENTUM_DECAY: document.getElementById('decaySlider'),
  };

  Object.entries(sliders).forEach(([key, el]) => {
    if (!el) return;

    // Initialise slider value from current CONFIG
    el.value = CONFIG[key];

    // Sync CONFIG on change
    el.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      CONFIG[key] = val;
      // Also update window.CONFIG for external tools/OJS if still active
      if (typeof window !== 'undefined' && window.CONFIG) {
        window.CONFIG[key] = val;
      }
    });
  });
}

// Begin Data Flow
initialiseEngine();
