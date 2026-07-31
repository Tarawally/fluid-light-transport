/**
 * @fileoverview Hybrid fluid-light transport engine.
 *
 * Combines stochastic ray tracing for light injection with a 2D cellular
 * automata solver for real-time light propagation, fluid advection, and diffusion.
 */
"use strict";

const CONFIG = {
  DOWNSAMPLE: 5,
  TILE_SIZE: 4,
  TIMESTEP_BUDGET_MS: 14,
  DISSIPATION: 0.97,
  MOMENTUM_DECAY: 0.92,
  ADVECTION_STRENGTH: 3.0,
  EXPOSURE: 2.5,
  GAMMA: 2.2,
  SCENE_URL: './assets/scene.json',
};

const FIELD = {
  R: 0,
  G: 1,
  B: 2,           // Spectral energy (colour)
  VEL_X: 3,
  VEL_Y: 4,       // Momentum vector (flow direction)
  ROUGHNESS: 5,   // Surface material friction
  DEPTH: 6,       // Distance from camera topology
  OBJECT_ID: 7,   // Object ID to prevent bleeding
  SLEEP_TIMER: 8, // Activity monitor for optimisation
};

const STRIDE = 9;

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: true });

let RESOLUTION = { W: 0, H: 0 };
let TOTAL_PIXELS = 0;
let TILES_X = 0;
let TILES_Y = 0;
let MASK_SIZE = 0;

const State = {
  lattice: null,
  displayImage: null,
  maskRead: null,
  maskWrite: null,
  cam: { x: 0, y: 0.5, z: -3.0, yaw: 0, pitch: 0 },
  input: { keys: {}, dragging: false, lastMouse: { x: 0, y: 0 } },
  viewMode: 0,
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

/**
 * Initialises system memory and calculates downsampled grid dimensions.
 */
function bootSystem() {
  const baseW = window.innerWidth;
  const baseH = window.innerHeight;

  RESOLUTION.W = Math.max(
    CONFIG.TILE_SIZE * 10,
    Math.floor(baseW / (CONFIG.DOWNSAMPLE * CONFIG.TILE_SIZE)) * CONFIG.TILE_SIZE
  );
  RESOLUTION.H = Math.max(
    CONFIG.TILE_SIZE * 10,
    Math.floor(baseH / (CONFIG.DOWNSAMPLE * CONFIG.TILE_SIZE)) * CONFIG.TILE_SIZE
  );

  canvas.width = RESOLUTION.W;
  canvas.height = RESOLUTION.H;

  TOTAL_PIXELS = RESOLUTION.W * RESOLUTION.H;
  TILES_X = Math.ceil(RESOLUTION.W / CONFIG.TILE_SIZE);
  TILES_Y = Math.ceil(RESOLUTION.H / CONFIG.TILE_SIZE);
  MASK_SIZE = Math.ceil((TILES_X * TILES_Y) / 32);

  State.lattice = new Float32Array(TOTAL_PIXELS * STRIDE);
  State.maskRead = new Uint32Array(MASK_SIZE);
  State.maskWrite = new Uint32Array(MASK_SIZE);
  State.displayImage = ctx.createImageData(RESOLUTION.W, RESOLUTION.H);

  if (State.profiler.dom.resDisplay) {
    State.profiler.dom.resDisplay.innerText = `${RESOLUTION.W}x${RESOLUTION.H}`;
  }
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

let lastWidth = window.innerWidth;
let lastHeight = window.innerHeight;

window.addEventListener('resize', debounce(() => {
  if (window.innerWidth !== lastWidth || window.innerHeight !== lastHeight) {
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
    bootSystem();
  }
}, 500));

let seed = 1337;
function nextFloat() {
  seed = (seed * 1664525 + 1013904223) | 0;
  return (seed >>> 0) / 4294967296;
}

function aces(x) {
  const a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14;
  return (x * (a * x + b)) / (x * (c * x + d) + e);
}

const Scene = {
  spheres: [],
  activeLight: null,

  cacheLightSource() {
    if (!this.spheres || this.spheres.length === 0) return;
    this.activeLight = this.spheres.find((s) => s.em > 0) || this.spheres[this.spheres.length - 1];
  },

  trace(roX, roY, roZ, rdX, rdY, rdZ) {
    let tMin = 1e9;
    let hitObj = null;

    for (let i = 0; i < this.spheres.length; i++) {
      const s = this.spheres[i];
      const ocX = roX - s.x;
      const ocY = roY - s.y;
      const ocZ = roZ - s.z;
      const b = ocX * rdX + ocY * rdY + ocZ * rdZ;
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
    return hitObj ? { t: tMin, obj: hitObj } : null;
  },
};

function activateSpatialRegion(tx, ty) {
  if (tx < 0 || tx >= TILES_X || ty < 0 || ty >= TILES_Y) return;
  const tileIdx = ty * TILES_X + tx;
  const arrIdx = tileIdx >>> 5;
  const bit = 1 << (tileIdx & 31);
  State.maskRead[arrIdx] |= bit;
  State.maskWrite[arrIdx] |= bit;
}

function evolveSimulation() {
  const perfStart = performance.now();
  let frameActiveTiles = 0;

  State.maskWrite.fill(0);

  for (let i = 0; i < MASK_SIZE; i++) {
    const block = State.maskRead[i];
    if (block === 0) continue;

    if (i % 10 === 0 && performance.now() - perfStart > CONFIG.TIMESTEP_BUDGET_MS) {
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

            if (State.lattice[ptr + FIELD.SLEEP_TIMER] < 1.0) {
              let vx = State.lattice[ptr + FIELD.VEL_X];
              let vy = State.lattice[ptr + FIELD.VEL_Y];
              const energy = State.lattice[ptr + FIELD.R] +
                             State.lattice[ptr + FIELD.G] +
                             State.lattice[ptr + FIELD.B];

              if (energy < 0.001 && Math.abs(vx) + Math.abs(vy) < 0.001) {
                State.lattice[ptr + FIELD.SLEEP_TIMER] = 1.0;
                continue;
              }

              const randX = nextFloat() - 0.5;
              const randY = nextFloat() - 0.5;
              const dx = Math.round(vx * CONFIG.ADVECTION_STRENGTH + randX * 0.5);
              const dy = Math.round(vy * CONFIG.ADVECTION_STRENGTH + randY * 0.5);
              const nx = px + dx;
              const ny = py + dy;

              if (nx >= 0 && nx < RESOLUTION.W && ny >= 0 && ny < RESOLUTION.H) {
                const nPtr = (ny * RESOLUTION.W + nx) * STRIDE;
                const depthDiff = Math.abs(
                  State.lattice[ptr + FIELD.DEPTH] - State.lattice[nPtr + FIELD.DEPTH]
                );

                if (depthDiff < 0.5) {
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

                  State.lattice[nPtr + FIELD.R] += State.lattice[ptr + FIELD.R] * eTransfer;
                  State.lattice[nPtr + FIELD.G] += State.lattice[ptr + FIELD.G] * eTransfer;
                  State.lattice[nPtr + FIELD.B] += State.lattice[ptr + FIELD.B] * eTransfer;

                  State.lattice[nPtr + FIELD.VEL_X] += vx * mTransfer * 0.9;
                  State.lattice[nPtr + FIELD.VEL_Y] += vy * mTransfer * 0.9;

                  State.lattice[ptr + FIELD.R] *= 1 - energyFlow;
                  State.lattice[ptr + FIELD.G] *= 1 - energyFlow;
                  State.lattice[ptr + FIELD.B] *= 1 - energyFlow;

                  const localDrag = CONFIG.MOMENTUM_DECAY * (1.0 - roughness * 0.5);
                  State.lattice[ptr + FIELD.VEL_X] *= localDrag;
                  State.lattice[ptr + FIELD.VEL_Y] *= localDrag;

                  State.lattice[nPtr + FIELD.SLEEP_TIMER] = 0.0;
                  activateSpatialRegion(
                    (nx / CONFIG.TILE_SIZE) | 0,
                    (ny / CONFIG.TILE_SIZE) | 0
                  );
                } else {
                  const airFlow = 0.15 * CONFIG.DISSIPATION;
                  State.lattice[nPtr + FIELD.R] += State.lattice[ptr + FIELD.R] * airFlow;
                  State.lattice[nPtr + FIELD.G] += State.lattice[ptr + FIELD.G] * airFlow;
                  State.lattice[nPtr + FIELD.B] += State.lattice[ptr + FIELD.B] * airFlow;

                  State.lattice[ptr + FIELD.R] *= 1 - airFlow;
                  State.lattice[ptr + FIELD.G] *= 1 - airFlow;
                  State.lattice[ptr + FIELD.B] *= 1 - airFlow;

                  State.lattice[ptr + FIELD.VEL_X] = 0.0;
                  State.lattice[ptr + FIELD.VEL_Y] = 0.0;

                  State.lattice[nPtr + FIELD.SLEEP_TIMER] = 0.0;
                  activateSpatialRegion(
                    (nx / CONFIG.TILE_SIZE) | 0,
                    (ny / CONFIG.TILE_SIZE) | 0
                  );
                }
              } else {
                State.lattice[ptr + FIELD.R] *= 0.8;
                State.lattice[ptr + FIELD.VEL_X] = 0;
                State.lattice[ptr + FIELD.VEL_Y] = 0;
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

  const light = Scene.activeLight;
  const camX = State.cam.x, camY = State.cam.y, camZ = State.cam.z;

  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const ox = (nextFloat() * gridW) | 0;
      const oy = (nextFloat() * gridH) | 0;
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

      const hit = Scene.trace(camX, camY, camZ, rxf, ryf, rzf);
      const obj = hit ? hit.obj : null;
      const objId = obj ? obj.id : -1;

      if (State.lattice[ptr + FIELD.OBJECT_ID] !== objId) {
        State.lattice[ptr + FIELD.R] = 0;
        State.lattice[ptr + FIELD.G] = 0;
        State.lattice[ptr + FIELD.B] = 0;
        State.lattice[ptr + FIELD.VEL_X] = 0;
        State.lattice[ptr + FIELD.VEL_Y] = 0;
        State.lattice[ptr + FIELD.OBJECT_ID] = objId;
        State.lattice[ptr + FIELD.SLEEP_TIMER] = 1.0;
      }

      if (obj) {
        const Px = camX + rxf * hit.t;
        const Py = camY + ryf * hit.t;
        const Pz = camZ + rzf * hit.t;

        const len = Math.sqrt(Px * Px + Py * Py + Pz * Pz);
        State.lattice[ptr + FIELD.DEPTH] = len / (1.0 + len * 0.15);
        State.lattice[ptr + FIELD.ROUGHNESS] = obj.rough;

        let emR, emG, emB;
        if (obj.em > 0) {
          emR = emG = emB = obj.em;
        } else {
          const nx = Px - obj.x, ny = Py - obj.y, nz = Pz - obj.z;
          const nl = 1.0 / Math.sqrt(nx * nx + ny * ny + nz * nz);
          const Nx = nx * nl, Ny = ny * nl, Nz = nz * nl;

          const ldX = light.x - Px, ldY = light.y - Py, ldZ = light.z - Pz;
          const distSq = ldX * ldX + ldY * ldY + ldZ * ldZ;
          const dist = Math.sqrt(distSq);

          const diff = Math.max(0, Nx * (ldX / dist) + Ny * (ldY / dist) + Nz * (ldZ / dist));
          const val = (light.em / distSq) * diff;
          emR = emG = emB = val;
        }

        const ir = emR * obj.col[0];
        const ig = emG * obj.col[1];
        const ib = emB * obj.col[2];

        if (obj.id === 5) {
          State.lattice[ptr + FIELD.R] = ir;
          State.lattice[ptr + FIELD.G] = ig;
          State.lattice[ptr + FIELD.B] = ib;
          State.lattice[ptr + FIELD.SLEEP_TIMER] = 0.0;
          activateSpatialRegion((x / CONFIG.TILE_SIZE) | 0, (y / CONFIG.TILE_SIZE) | 0);
          continue;
        }

        const ldX = light.x - Px;
        const ldZ = light.z - Pz;
        const lenL = Math.sqrt(ldX * ldX + ldZ * ldZ) + 1e-6;
        const impulse = Math.min(emR * 0.01, 0.05);

        State.lattice[ptr + FIELD.VEL_X] += (ldX / lenL) * impulse;
        State.lattice[ptr + FIELD.VEL_Y] += (ldZ / lenL) * impulse;

        State.lattice[ptr + FIELD.R] = State.lattice[ptr + FIELD.R] * invAlpha + ir * 0.1;
        State.lattice[ptr + FIELD.G] = State.lattice[ptr + FIELD.G] * invAlpha + ig * 0.1;
        State.lattice[ptr + FIELD.B] = State.lattice[ptr + FIELD.B] * invAlpha + ib * 0.1;

        State.lattice[ptr + FIELD.SLEEP_TIMER] = 0.0;
        activateSpatialRegion((x / CONFIG.TILE_SIZE) | 0, (y / CONFIG.TILE_SIZE) | 0);
      } else {
        State.lattice[ptr + FIELD.R] *= 0.8;
        State.lattice[ptr + FIELD.VEL_X] = 0;
        State.lattice[ptr + FIELD.VEL_Y] = 0;
        State.lattice[ptr + FIELD.SLEEP_TIMER] = 1.0;
      }
    }
  }

  evolveSimulation();

  const imageData = State.displayImage;
  const data = imageData.data;
  const invGamma = 1.0 / CONFIG.GAMMA;

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const ptr = (y * W + x) * STRIDE;
      const pIdx = (y * W + x) * 4;
      let r = 0, g = 0, b = 0;

      if (State.viewMode === 0) {
        r = aces(State.lattice[ptr + FIELD.R] * CONFIG.EXPOSURE);
        g = aces(State.lattice[ptr + FIELD.G] * CONFIG.EXPOSURE);
        b = aces(State.lattice[ptr + FIELD.B] * CONFIG.EXPOSURE);
      } else if (State.viewMode === 1) {
        const tx = (x / CONFIG.TILE_SIZE) | 0;
        const ty = (y / CONFIG.TILE_SIZE) | 0;
        const tIdx = ty * TILES_X + tx;
        if ((State.maskRead[tIdx >> 5] & (1 << (tIdx & 31))) !== 0) {
          g = 0.15;
        }
        r += State.lattice[ptr + FIELD.R];
      } else if (State.viewMode === 2) {
        r = Math.abs(State.lattice[ptr + FIELD.VEL_X]);
        b = Math.abs(State.lattice[ptr + FIELD.VEL_Y]);
      }

      const dither = (nextFloat() - 0.5) * (1.0 / 255.0);
      data[pIdx]     = Math.min(255, Math.pow(r + dither, invGamma) * 255);
      data[pIdx + 1] = Math.min(255, Math.pow(g + dither, invGamma) * 255);
      data[pIdx + 2] = Math.min(255, Math.pow(b + dither, invGamma) * 255);
      data[pIdx + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  updateTelemetry();
  requestAnimationFrame(mainSimulationLoop);
}

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

function updateTelemetry() {
  const now = performance.now();
  if (now - State.profiler.lastTime >= 1000) {
    const avgTiles = Math.round(State.profiler.accumulatedTiles / State.profiler.frameCount);
    const avgTime = (State.profiler.accumulatedTime / State.profiler.frameCount).toFixed(2);
    const totalTiles = TILES_X * TILES_Y;
    const sparsity = totalTiles > 0 ? ((1.0 - (avgTiles / totalTiles)) * 100).toFixed(1) : 0;

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
  State.input.lastMouse = { x: e.clientX, y: e.clientY };
});

window.addEventListener('mouseup', () => (State.input.dragging = false));

window.addEventListener('mousemove', (e) => {
  if (!State.input.dragging) return;
  const dx = e.clientX - State.input.lastMouse.x;
  const dy = e.clientY - State.input.lastMouse.y;
  State.input.lastMouse = { x: e.clientX, y: e.clientY };

  if (e.button === 0) {
    State.cam.yaw += dx * 0.005;
    State.cam.pitch -= dy * 0.005;
    State.lattice.fill(0);
    State.maskRead.fill(0);
  } else if (e.button === 2) {
    const light = Scene.spheres.find((s) => s.id === 5);
    if (light) {
      light.x += dx * 0.02;
      light.y -= dy * 0.02;
      State.lattice.fill(0);
      State.maskRead.fill(0);
    }
  }
});

window.addEventListener('keydown', (e) => {
  State.input.keys[e.key.toLowerCase()] = true;
  if (e.code === 'Space') {
    State.viewMode = (State.viewMode + 1) % 3;
    const modes = ['Composite output', 'Active tile map', 'Velocity vector field'];
    if (State.profiler.dom.viewMode) {
      State.profiler.dom.viewMode.innerText = modes[State.viewMode];
    }
  }
});

window.addEventListener('keyup', (e) => {
  State.input.keys[e.key.toLowerCase()] = false;
});

async function initialiseEngine() {
  const sourceDisplay = document.getElementById('sceneSource');
  try {
    if (sourceDisplay) sourceDisplay.textContent = CONFIG.SCENE_URL;
    const response = await fetch(CONFIG.SCENE_URL);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    const sceneData = await response.json();

    Scene.spheres = sceneData || [];
    Scene.cacheLightSource();

    setTimeout(() => {
      bootSystem();
      requestAnimationFrame(mainSimulationLoop);
    }, 100);

    setupUIControlListeners();
  } catch (error) {
    console.error('Data flow interruption:', error);
  }
}

function setupUIControlListeners() {
  const sliders = {
    DISSIPATION: document.getElementById('dissipationSlider'),
    ADVECTION_STRENGTH: document.getElementById('advectionSlider'),
    MOMENTUM_DECAY: document.getElementById('decaySlider'),
  };

  Object.entries(sliders).forEach(([key, el]) => {
    if (!el) return;
    el.value = CONFIG[key];
    el.addEventListener('input', (e) => {
      CONFIG[key] = parseFloat(e.target.value);
    });
  });
}

initialiseEngine();
