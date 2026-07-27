---
title: "API Reference"
---

# API Reference

This documentation is automatically generated from source code JSDoc comments.

<div class="note">

### Source Code
The primary simulation logic resides in `src/engine.js`.

</div>

## Members

<dl>
<dt><a href="#RESOLUTION">RESOLUTION</a> : <code>Object</code></dt>
<dd><p>Internal resolution dimensions.</p>
</dd>
<dt><a href="#TOTAL_PIXELS">TOTAL_PIXELS</a> : <code>number</code></dt>
<dd><p>Total number of pixels in the simulation grid.</p>
</dd>
<dt><a href="#TILES_X">TILES_X</a> : <code>number</code></dt>
<dd><p>Number of tiles horizontally.</p>
</dd>
<dt><a href="#TILES_Y">TILES_Y</a> : <code>number</code></dt>
<dd><p>Number of tiles vertically.</p>
</dd>
<dt><a href="#MASK_SIZE">MASK_SIZE</a> : <code>number</code></dt>
<dd><p>Size of the bitmask array.</p>
</dd>
</dl>

## Constants

<dl>
<dt><a href="#CONFIG">CONFIG</a></dt>
<dd><p>Configuration constants for the simulation.</p>
</dd>
<dt><a href="#STRIDE">STRIDE</a> : <code>number</code></dt>
<dd><p>Total number of floats per pixel in the lattice.</p>
</dd>
<dt><a href="#State">State</a></dt>
<dd><p>The global state object containing simulation data and metadata.</p>
</dd>
<dt><a href="#MathLib">MathLib</a></dt>
<dd><p>Mathematical utility functions.</p>
</dd>
<dt><a href="#Scene">Scene</a></dt>
<dd><p>Scene definition and ray tracing logic.
Populated via asynchronous fetch.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#bootSystem">bootSystem()</a></dt>
<dd><p>Initialises the simulation by allocating memory and computing grid dimensions.
This function performs critical setup:</p>
<ol>
<li>Calculates internal resolution based on window size and downsampling</li>
<li>Resizes canvas to match resolution</li>
<li>Computes tile grid dimensions for spatial optimisation</li>
<li>Allocates typed arrays for state storage</li>
<li>Creates image buffer for rendering</li>
</ol>
</dd>
<dt><a href="#debounce">debounce(func, wait)</a> ⇒ <code>function</code></dt>
<dd><p>Debounce utility to limit function execution rate.</p>
</dd>
<dt><a href="#activateSpatialRegion">activateSpatialRegion(tx, ty)</a></dt>
<dd><p>Marks a specific spatial region (tile) as active.
This ensures the physics solver will process this region in the next frame.</p>
</dd>
<dt><a href="#evolveSimulation">evolveSimulation()</a></dt>
<dd><p>Evolves the simulation state by one timestep.
Uses Cellular Automata to flow light energy from pixel to pixel.</p>
</dd>
<dt><a href="#mainSimulationLoop">mainSimulationLoop()</a></dt>
<dd><p>The main game loop. Handles input, physics, and rendering.</p>
</dd>
<dt><a href="#handleInput">handleInput()</a> ⇒ <code>boolean</code></dt>
<dd><p>Handles user input to update the camera position.</p>
</dd>
<dt><a href="#updateTelemetry">updateTelemetry()</a></dt>
<dd><p>Updates the on-screen telemetry display.</p>
</dd>
<dt><a href="#initialiseEngine">initialiseEngine()</a></dt>
<dd><p>Bootstraps the engine by fetching configuration data.</p>
</dd>
<dt><a href="#setupUIControlListeners">setupUIControlListeners()</a></dt>
<dd><p>Connects HTML sliders to the engine configuration.</p>
</dd>
<dt><a href="#normalize2D">normalize2D(x, y)</a> ⇒ <code>Array.&lt;number&gt;</code></dt>
<dd><p>Returns a normalised 2D vector (new array).</p>
</dd>
<dt><a href="#dot2D">dot2D(x1, y1, x2, y2)</a> ⇒ <code>number</code></dt>
<dd><p>Calculates the dot product of two 2D vectors.</p>
</dd>
<dt><a href="#clamp">clamp(val, min, max)</a> ⇒ <code>number</code></dt>
<dd><p>Returns a value clamped between min and max.</p>
</dd>
</dl>

<a name="RESOLUTION"></a>

## RESOLUTION : <code>Object</code>
Internal resolution dimensions.

**Kind**: global variable  
<a name="TOTAL_PIXELS"></a>

## TOTAL\_PIXELS : <code>number</code>
Total number of pixels in the simulation grid.

**Kind**: global variable  
<a name="TILES_X"></a>

## TILES\_X : <code>number</code>
Number of tiles horizontally.

**Kind**: global variable  
<a name="TILES_Y"></a>

## TILES\_Y : <code>number</code>
Number of tiles vertically.

**Kind**: global variable  
<a name="MASK_SIZE"></a>

## MASK\_SIZE : <code>number</code>
Size of the bitmask array.

**Kind**: global variable  
<a name="FIELD"></a>

## FIELD : <code>enum</code>
Memory layout offsets for the Structure of Arrays (SoA).
Access a pixel's property by: index = (y * width + x) * STRIDE + OFFSET.

**Kind**: global enum  
**Properties**

| Name | Type | Default |
| --- | --- | --- |
| R | <code>number</code> | <code>0</code> | 
| G | <code>number</code> | <code>1</code> | 
| B | <code>number</code> | <code>2</code> | 
| VEL_X | <code>number</code> | <code>4</code> | 
| VEL_Y | <code>number</code> | <code>5</code> | 
| ROUGHNESS | <code>number</code> | <code>6</code> | 
| DEPTH | <code>number</code> | <code>7</code> | 
| OBJECT_ID | <code>number</code> | <code>11</code> | 
| SLEEP_TIMER | <code>number</code> | <code>12</code> | 

<a name="CONFIG"></a>

## CONFIG
Configuration constants for the simulation.

**Kind**: global constant  

* [CONFIG](#CONFIG)
    * [.DOWNSAMPLE](#CONFIG.DOWNSAMPLE) : <code>number</code>
    * [.TILE_SIZE](#CONFIG.TILE_SIZE) : <code>number</code>
    * [.TIMESTEP_BUDGET_MS](#CONFIG.TIMESTEP_BUDGET_MS) : <code>number</code>
    * [.DISSIPATION](#CONFIG.DISSIPATION) : <code>number</code>
    * [.MOMENTUM_DECAY](#CONFIG.MOMENTUM_DECAY) : <code>number</code>
    * [.ADVECTION_STRENGTH](#CONFIG.ADVECTION_STRENGTH) : <code>number</code>
    * [.EXPOSURE](#CONFIG.EXPOSURE) : <code>number</code>
    * [.GAMMA](#CONFIG.GAMMA) : <code>number</code>

<a name="CONFIG.DOWNSAMPLE"></a>

### CONFIG.DOWNSAMPLE : <code>number</code>
Resolution downsampling factor.
To maintain 60 FPS, we downsample the window resolution.
A 1920px width becomes a ~384px width simulation grid.

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="CONFIG.TILE_SIZE"></a>

### CONFIG.TILE\_SIZE : <code>number</code>
Size of a tile in pixels (width and height).
Physics is activated in 4x4 "Blocks" (Tiles).

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="CONFIG.TIMESTEP_BUDGET_MS"></a>

### CONFIG.TIMESTEP\_BUDGET\_MS : <code>number</code>
Maximum time allowed for physics calculations per frame (in milliseconds).
If calculations exceed this, the loop aborts to ensure the frame renders.

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="CONFIG.DISSIPATION"></a>

### CONFIG.DISSIPATION : <code>number</code>
Energy lost to entropy per tick.

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="CONFIG.MOMENTUM_DECAY"></a>

### CONFIG.MOMENTUM\_DECAY : <code>number</code>
Momentum decay factor (viscosity).
How quickly light stops "flowing".

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="CONFIG.ADVECTION_STRENGTH"></a>

### CONFIG.ADVECTION\_STRENGTH : <code>number</code>
Magnitude of flow per tick.

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="CONFIG.EXPOSURE"></a>

### CONFIG.EXPOSURE : <code>number</code>
Virtual camera aperture.

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="CONFIG.GAMMA"></a>

### CONFIG.GAMMA : <code>number</code>
Monitor gamma correction.

**Kind**: static property of [<code>CONFIG</code>](#CONFIG)  
<a name="STRIDE"></a>

## STRIDE : <code>number</code>
Total number of floats per pixel in the lattice.

**Kind**: global constant  
<a name="State"></a>

## State
The global state object containing simulation data and metadata.

**Kind**: global constant  

* [State](#State)
    * [.lattice](#State.lattice) : <code>Float32Array</code> \| <code>null</code>
    * [.displayImage](#State.displayImage) : <code>ImageData</code> \| <code>null</code>
    * [.maskRead](#State.maskRead) : <code>Uint32Array</code> \| <code>null</code>
    * [.maskWrite](#State.maskWrite) : <code>Uint32Array</code> \| <code>null</code>
    * [.cam](#State.cam) : <code>Object</code>
    * [.input](#State.input)
    * [.viewMode](#State.viewMode) : <code>number</code>
    * [.profiler](#State.profiler)

<a name="State.lattice"></a>

### State.lattice : <code>Float32Array</code> \| <code>null</code>
The single buffer containing the entire universe's state.
Allocated in bootSystem().

**Kind**: static property of [<code>State</code>](#State)  
<a name="State.displayImage"></a>

### State.displayImage : <code>ImageData</code> \| <code>null</code>
Persistent display buffer to avoid expensive read-backs.

**Kind**: static property of [<code>State</code>](#State)  
<a name="State.maskRead"></a>

### State.maskRead : <code>Uint32Array</code> \| <code>null</code>
Bitmask tracking active regions for the current frame.

**Kind**: static property of [<code>State</code>](#State)  
<a name="State.maskWrite"></a>

### State.maskWrite : <code>Uint32Array</code> \| <code>null</code>
Bitmask tracking active regions for the next frame.

**Kind**: static property of [<code>State</code>](#State)  
<a name="State.cam"></a>

### State.cam : <code>Object</code>
Camera position and orientation.

**Kind**: static property of [<code>State</code>](#State)  
<a name="State.input"></a>

### State.input
User input state.

**Kind**: static property of [<code>State</code>](#State)  
<a name="State.viewMode"></a>

### State.viewMode : <code>number</code>
Current view mode.
0: Composite Output
1: Active Tile Map
2: Velocity Vector Field

**Kind**: static property of [<code>State</code>](#State)  
<a name="State.profiler"></a>

### State.profiler
Performance profiling data.

**Kind**: static property of [<code>State</code>](#State)  
<a name="MathLib"></a>

## MathLib
Mathematical utility functions.

**Kind**: global constant  

* [MathLib](#MathLib)
    * [.nextFloat()](#MathLib.nextFloat) ⇒ <code>number</code>
    * [.toHyperbolic(x, y, z)](#MathLib.toHyperbolic) ⇒ <code>Array.&lt;number&gt;</code>
    * [.aces(x)](#MathLib.aces) ⇒ <code>number</code>

<a name="MathLib.nextFloat"></a>

### MathLib.nextFloat() ⇒ <code>number</code>
Fast pseudo-random number generator using Linear Congruential Generator (LCG).
Provides deterministic random values based on internal seed state.
Uses the same parameters as the POSIX rand48 family.

**Kind**: static method of [<code>MathLib</code>](#MathLib)  
**Returns**: <code>number</code> - Pseudo-random float in range [0, 1)  
**Algorithm**: LCG formula: seed = (a × seed + c) mod m
Where: a = 1664525, c = 1013904223, m = 2³²
Output: seed / 2³² to normalise to [0, 1)  
**Performance**: O(1) - Single multiply-add operation  
**Deterministic**: true - Same seed produces same sequence  
**Example**  
```js
// Generate random positions
const x = MathLib.nextFloat() * width;
const y = MathLib.nextFloat() * height;
```
<a name="MathLib.toHyperbolic"></a>

### MathLib.toHyperbolic(x, y, z) ⇒ <code>Array.&lt;number&gt;</code>
Poincaré Ball Projection.
Compresses infinite Euclidean distance into a 0.0-1.0 range.

**Kind**: static method of [<code>MathLib</code>](#MathLib)  
**Returns**: <code>Array.&lt;number&gt;</code> - [x, y, z] projected coordinates.  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 
| z | <code>number</code> | 

<a name="MathLib.aces"></a>

### MathLib.aces(x) ⇒ <code>number</code>
ACES (Academy Colour Encoding System) tone mapping curve.
Maps High Dynamic Range (HDR) values to Low Dynamic Range (LDR)
for display on standard monitors. Preserves colour relationships
and provides smooth highlight rolloff.

**Kind**: static method of [<code>MathLib</code>](#MathLib)  
**Returns**: <code>number</code> - Tone-mapped LDR value (typically [0, 1])  
**Algorithm**: Rational function approximation:
f(x) = (x(ax + b)) / (x(cx + d) + e)
Constants tuned for perceptually pleasing results  
**See**: [https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/](https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/)  

| Param | Type | Description |
| --- | --- | --- |
| x | <code>number</code> | Input HDR colour value (unbounded range) |

**Example**  
```js
// Tone map HDR pixel values
const hdrColour = 5.2;  // Bright light source
const ldrColour = MathLib.aces(hdrColour);  // ~0.95
```
<a name="Scene"></a>

## Scene
Scene definition and ray tracing logic.
Populated via asynchronous fetch.

**Kind**: global constant  

* [Scene](#Scene)
    * [.cacheLightSource()](#Scene.cacheLightSource)
    * [.trace(ro, rd)](#Scene.trace) ⇒ <code>Object</code>
    * [.shade(hit, ro, rd)](#Scene.shade) ⇒ <code>Object</code> \| <code>null</code>

<a name="Scene.cacheLightSource"></a>

### Scene.cacheLightSource()
Updates the cached active light source.
Should be called when the scene loads or changes.

**Kind**: static method of [<code>Scene</code>](#Scene)  
<a name="Scene.trace"></a>

### Scene.trace(ro, rd) ⇒ <code>Object</code>
Performs ray-sphere intersection using geometric algebra.
Uses the discriminant method to solve the quadratic equation
formed by substituting the ray equation into the sphere equation.

**Kind**: static method of [<code>Scene</code>](#Scene)  
**Returns**: <code>Object</code> - Intersection result  
**Algorithm**: Solves: |P(t) - C|² = r²
Where: P(t) = O + tD (ray equation)
Expands to: at² + bt + c = 0
Discriminant: Δ = b² - 4ac
If Δ > 0: two intersections (entry and exit)
Takes nearest positive t value  

| Param | Type | Description |
| --- | --- | --- |
| ro | <code>Array.&lt;number&gt;</code> | Ray origin [x, y, z] |
| rd | <code>Array.&lt;number&gt;</code> | Ray direction [x, y, z], should be normalised |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| t | <code>number</code> | Distance along ray to intersection (1e9 if no hit) |
| obj | <code>Object</code> \| <code>null</code> | The sphere object that was hit, or null |

**Example**  
```js
const ray = {origin: [0, 0, -5], direction: [0, 0, 1]};
const hit = Scene.trace(ray.origin, ray.direction);
if (hit.obj) {
  console.log(`Hit sphere at distance ${hit.t}`);
}
```
<a name="Scene.shade"></a>

### Scene.shade(hit, ro, rd) ⇒ <code>Object</code> \| <code>null</code>
Computes lighting and material properties at a ray intersection point.
Implements basic Lambertian diffuse shading with distance attenuation.

**Kind**: static method of [<code>Scene</code>](#Scene)  
**Returns**: <code>Object</code> \| <code>null</code> - Shading information or null if no hit  

| Param | Type | Description |
| --- | --- | --- |
| hit | <code>Object</code> | Intersection data from trace() |
| ro | <code>Array.&lt;number&gt;</code> | Ray origin [x, y, z] |
| rd | <code>Array.&lt;number&gt;</code> | Ray direction [x, y, z] |

**Properties**

| Name | Type | Description |
| --- | --- | --- |
| albedo | <code>Array.&lt;number&gt;</code> | Surface colour [r, g, b] |
| emission | <code>Array.&lt;number&gt;</code> | Emitted light [r, g, b] |
| normal | <code>Array.&lt;number&gt;</code> | Surface normal [x, y, z] |
| position | <code>Array.&lt;number&gt;</code> | World-space position [x, y, z] |
| depth | <code>number</code> | Distance from camera |
| diffuse | <code>number</code> | Lambertian diffuse term (N·L) |
| falloff | <code>number</code> | Distance-based attenuation |

**Example**  
```js
const hit = Scene.trace(ro, rd);
const shading = Scene.shade(hit, ro, rd);
if (shading) {
  // Use shading.albedo, shading.emission, etc.
  const finalColour = shading.albedo.map((c, i) => 
    c * shading.diffuse * shading.falloff + shading.emission[i]
  );
}
```
<a name="bootSystem"></a>

## bootSystem()
Initialises the simulation by allocating memory and computing grid dimensions.
This function performs critical setup:
1. Calculates internal resolution based on window size and downsampling
2. Resizes canvas to match resolution
3. Computes tile grid dimensions for spatial optimisation
4. Allocates typed arrays for state storage
5. Creates image buffer for rendering

**Kind**: global function  
**Emits**: <code>window#resize - Automatically called when window is resized (debounced)</code>  
**Example**  
```js
// Called automatically on page load
window.addEventListener('load', bootSystem);
```
**Example**  
```js
// Manually reinitialise after config change
CONFIG.DOWNSAMPLE = 8;
bootSystem();
```
<a name="debounce"></a>

## debounce(func, wait) ⇒ <code>function</code>
Debounce utility to limit function execution rate.

**Kind**: global function  
**Returns**: <code>function</code> - The debounced function.  

| Param | Type | Description |
| --- | --- | --- |
| func | <code>function</code> | The function to debounce. |
| wait | <code>number</code> | The delay in milliseconds. |

<a name="activateSpatialRegion"></a>

## activateSpatialRegion(tx, ty)
Marks a specific spatial region (tile) as active.
This ensures the physics solver will process this region in the next frame.

**Kind**: global function  

| Param | Type | Description |
| --- | --- | --- |
| tx | <code>number</code> | Tile X index. |
| ty | <code>number</code> | Tile Y index. |

<a name="evolveSimulation"></a>

## evolveSimulation()
Evolves the simulation state by one timestep.
Uses Cellular Automata to flow light energy from pixel to pixel.

**Kind**: global function  
<a name="mainSimulationLoop"></a>

## mainSimulationLoop()
The main game loop. Handles input, physics, and rendering.

**Kind**: global function  
<a name="handleInput"></a>

## handleInput() ⇒ <code>boolean</code>
Handles user input to update the camera position.

**Kind**: global function  
**Returns**: <code>boolean</code> - True if the camera moved, false otherwise.  
<a name="updateTelemetry"></a>

## updateTelemetry()
Updates the on-screen telemetry display.

**Kind**: global function  
<a name="initialiseEngine"></a>

## initialiseEngine()
Bootstraps the engine by fetching configuration data.

**Kind**: global function  
<a name="setupUIControlListeners"></a>

## setupUIControlListeners()
Connects HTML sliders to the engine configuration.

**Kind**: global function  
<a name="normalize2D"></a>

## normalize2D(x, y) ⇒ <code>Array.&lt;number&gt;</code>
Returns a normalised 2D vector (new array).

**Kind**: global function  
**Returns**: <code>Array.&lt;number&gt;</code> - The normalised vector [x, y]  

| Param | Type |
| --- | --- |
| x | <code>number</code> | 
| y | <code>number</code> | 

<a name="dot2D"></a>

## dot2D(x1, y1, x2, y2) ⇒ <code>number</code>
Calculates the dot product of two 2D vectors.

**Kind**: global function  
**Returns**: <code>number</code> - The dot product.  

| Param | Type |
| --- | --- |
| x1 | <code>number</code> | 
| y1 | <code>number</code> | 
| x2 | <code>number</code> | 
| y2 | <code>number</code> | 

<a name="clamp"></a>

## clamp(val, min, max) ⇒ <code>number</code>
Returns a value clamped between min and max.

**Kind**: global function  
**Returns**: <code>number</code> - The clamped value.  

| Param | Type | Description |
| --- | --- | --- |
| val | <code>number</code> | Input value. |
| min | <code>number</code> | Lower bound. |
| max | <code>number</code> | Upper bound. |


