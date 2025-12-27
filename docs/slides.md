---
title: "Data Flow & State Management"
subtitle: "High Performance Approach in Low End Devices"
format: 
  revealjs:
    jump-to-slide: true
    scroll-view: true
---

## 1. The Data Pipeline

Managing complex state requires a strict, unidirectional flow:

**Source $\to$ Store $\to$ Transform $\to$ Sink**

*   **Source:** `fetch('scene.json')` (Async Input)
*   **Store:** `Float32Array` Lattice (The State)
*   **Transform:** Fluid Dynamics (The Logic)
*   **Sink:** HTML5 Canvas (The View)

::: {.notes}
 The core challenge is managing data flow. I implemented a strict pipeline where data moves in one direction. It is fetched, stored in memory, transformed by physics rules, and finally rendered to the view.

 This unidirectional flow prevents common pitfalls like circular dependencies and makes debugging predictable. The Float32Array serves as the single source of truth, completely isolated from the DOM rendering layer.
:::

---

## 2. Managing State at Scale

**The Challenge:**
200,000 active pixels is too much for standard Objects or DOM nodes.

::: {.columns}
::: {.column width="50%"}
**Standard Approach (Slow)**
```javascript
// Array of Objects
const pixels = [];
for (let i = 0; i < TOTAL_PIXELS; i++) {
  pixels.push({
    r: 0, g: 0, b: 0,
    velX: 0, velY: 0,
    // ... 9 more properties
  });
}

// Access
pixels[1000].r = 0.9;
```
**Memory: ~60 MB**
:::

::: {.column width="50%"}
**Typed Array (Fast)**
```javascript
// Interleaved Float32Array
const STRIDE = 14; 
State.lattice = new Float32Array(
  TOTAL_PIXELS * STRIDE
);

// Physics
function evolveSimulation() {
  /* Light Flow Rules*/
}

// Access
lattice[1000 * 14 + 0] = 0.9;
```
**Memory: ~11 MB**
:::
:::

::: {.notes}
 To handle this scale, I moved state out of the DOM. The "Lattice" uses JavaScript's Typed Array API—specifically Float32Array—which provides a view over a raw ArrayBuffer. 
 
 **Important part:**

 - This is an interleaved data layout where all pixel properties are packed sequentially.

 Float32Array is a JavaScript typed array that stores 32-bit floating point numbers (4 bytes each) in contiguous memory backed by an ArrayBuffer.
 Unlike standard JavaScript arrays (which store Float64 or boxed objects), typed arrays have zero per-element overhead. For 200,000 pixels with 14 properties each: Float32Array uses ~11 MB versus ~60 MB for object arrays.
 The STRIDE constant (14) defines the interleaving pattern—how many consecutive array elements represent one logical pixel. Accessing data requires manual index calculation (pixelIndex * 14 + offset), trading JavaScript's dynamic property access for 10x performance gains and zero garbage collection pauses.
:::

---

## 3. Architecture Analysis

**Trade-offs:**

*   **(+) Performance:** Zero garbage collection, extreme speed.
*   **(+) Predictability:** State is strictly isolated from the View.
*   **(-) Complexity:** Manual memory management is harder to maintain.

---

**Live Demo:**

1.  **Async Load:** Verify network fetch.
2.  **State Vis:** See raw velocity vectors (Spacebar).
3.  **Interaction:** Mutate state in real-time (Right-Click).

::: {.notes}
 This architecture trades JavaScript's flexibility for raw performance. It proves that treating the DOM purely as a rendering viewport for a typed array data store enables high-performance applications that standard object-based state management cannot achieve.

 The key trade-off: you lose JavaScript's dynamic property access (pixel.r becomes lattice[i*14+0]) but gain cache-efficient sequential memory that's ~10x faster. At 200,000 pixels × 60 FPS = 12 million operations per second, standard JavaScript objects cause frequent garbage collection pauses. Typed arrays eliminate this by using fixed-size ArrayBuffers that can be directly transferred to WebGL via bufferData() for GPU rendering. The evolveSimulation function reads and writes the Float32Array in-place using stride-based indexing, processing every active pixel based on local neighborhood rules—essentially a functional map() operation optimized for real-time physics in JavaScript.
:::