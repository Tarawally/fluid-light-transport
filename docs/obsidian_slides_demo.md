# Hybrid Fluid-Light Transport Engine
### Advanced Data Flow & State Management

---

# The Core Idea

> "Instead of creating DOM nodes for a list, I am manipulating the DOM at the pixel level."

This project pushes **State Management** to the limit:
A physics based light simulation running in the browser.

---

# The DOM & The Canvas

The HTML5 Canvas is a DOM element. We read its state, change it in memory, and write it back.

```javascript
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d", { 
  alpha: false, 
  willReadFrequently: true 
});

// Reading and writing state directly to the DOM element
const imageData = ctx.getImageData(0, 0, W, H);
// ... manipulation ...
ctx.putImageData(imageData, 0, 0);
```

---

# State Management: The Lattice

Creating millions of Objects crashes the browser. I use a **Structure of Arrays (SoA)** layout instead.

A single `Float32Array` holds the entire state of the universe.

```javascript
const FIELD = {
  R: 0,
  G: 1,
  B: 2,
  VEL_X: 4,
  VEL_Y: 5,
  ROUGHNESS: 6,
  DEPTH: 7,
  OBJECT_ID: 11
};

// Single flat array for all state
State.lattice = new Float32Array(TOTAL_PIXELS * STRIDE);
```

---

# Data Flow: `evolveSimulation`

This function is like a complex `.map()` operation.

1.  **Input:** Current State (Previous Frame)
2.  **Transformation:** Physics Rules (Advection & Diffusion)
3.  **Output:** New State (Next Frame)

```javascript
function evolveSimulation() {
  // ...
  // Transfer RGB (Energy)
  State.lattice[nPtr + 0] += State.lattice[ptr + 0] * eTransfer;
  // Transfer Momentum (Velocity)
  State.lattice[nPtr + 4] += vx * mTransfer * 0.9;
  // ...
}
```

---

# Optimisation: Bitmasking

Processing every pixel is too slow.

I implemented **Spatial Optimisation** using bitmasks. We only process regions where light is actually moving.

```javascript
function activateSpatialRegion(tx, ty) {
  let tileIdx = ty * TILES_X + tx;
  let arrIdx = tileIdx >>> 5; 
  // Bitwise OR to mark region as active
  State.maskRead[arrIdx] |= 1 << (tileIdx & 31);
}
```

---

# Asynchronous Data Fetching

The scene data loads asynchronously before the engine starts.

```javascript
async function bootSystem() {
  const response = await fetch('scene.json');
  const sceneData = await response.json();
  
  Scene.spheres = sceneData.spheres;
  
  // Allocate memory after data is ready
  State.lattice = new Float32Array(TOTAL_PIXELS * STRIDE);
  requestAnimationFrame(mainSimulationLoop);
}
```

---

# Demo & Controls

**Live Stats:**
-   FPS & Compute Time
-   Active Grid Sparsity

**Controls:**
-   **Mouse Left:** Rotate Camera
-   **Mouse Right:** Move Light Source
-   **Spacebar:** Change View Modes (Output, Debug Grid, Velocity)