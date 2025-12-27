---
title: "Hybrid Fluid-Light Transport: A Literate Analysis"
format:
  html:
    code-fold: true
---

## Introduction

This notebook explores the theoretical underpinnings of the **Hybrid Fluid-Light Transport Engine**. 
Instead of treating light solely as rays (Ray Tracing) or solely as radiant flux (Radiosity), we model it as a **fluid substance** that advects and diffuses across a surface topology.

This approach allows for real-time soft shadows and colour bleeding by leveraging **Cellular Automata (CA)** for propagation after an initial **Ray Tracing** injection step.

## Simulation Parameters

We can model the behavior of the light fluid using standard fluid dynamics parameters.
Adjust the sliders below to see how they affect the theoretical propagation model.

```{ojs}
//| panel: sidebar
viewof dissipation = Inputs.range([0.8, 0.99], {value: 0.97, step: 0.01, label: "Dissipation (Entropy)"})
viewof advection = Inputs.range([0.0, 5.0], {value: 3.0, step: 0.1, label: "Advection Strength"})
viewof diffusion = Inputs.range([0.0, 1.0], {value: 0.5, step: 0.05, label: "Diffusion (Spread)"})
```

```{ojs}
md`
**Current Configuration:**
*   **Energy Conservation:** ${(dissipation * 100).toFixed(1)}% retained per tick
*   **Flow Velocity:** ${advection.toFixed(1)} pixels/tick
*   **Scatter:** ${(diffusion * 100).toFixed(1)}% randomness
`
```

## The Physics Model

The core logic revolves around the **Navier-Stokes equations**, simplified for a 2D grid where "pressure" is replaced by "light intensity".

### 1. Injection Phase
We first probe the scene geometry to find where photons hit.

```javascript
// Stochastic Ray Tracing
let hit = Scene.trace(rayOrigin, rayDirection);
if (hit) {
    // Inject energy into the lattice
    State.lattice[index] += hit.emission;
}
```

### 2. Propagation Phase (The Fluid Solver)
Once energy is in the lattice, we evolve it using a Cellular Automata rule. This is where the **OJS** interactivity comes in. We can visualise a simplified 1D slice of this propagation.

```{ojs}
//| label: fig-propagation
//| fig-cap: "1D Slice of Light Propagation over Time"

// Simple 1D simulation of advection-diffusion
function simulate1D(steps, disp, adv, diff) {
  let width = 100;
  let grid = new Float32Array(width).fill(0);
  let nextGrid = new Float32Array(width).fill(0);
  
  // Initial impulse (light source)
  grid[20] = 1.0; 
  
  let history = [];
  
  for(let t=0; t<steps; t++) {
    for(let x=0; x<width; x++) {
      let val = grid[x];
      if(val < 0.01) continue;
      
      // Advection (move forward)
      let target = Math.min(width-1, Math.round(x + adv));
      
      // Diffusion (spread to neighbors)
      let amount = val * disp;
      nextGrid[target] += amount * (1-diff);
      if(target+1 < width) nextGrid[target+1] += amount * (diff/2);
      if(target-1 >= 0)    nextGrid[target-1] += amount * (diff/2);
    }
    // Swap and decay
    for(let i=0; i<width; i++) {
        grid[i] = nextGrid[i];
        nextGrid[i] = 0;
    }
    history.push(Array.from(grid));
  }
  return history;
}

data = simulate1D(50, dissipation, advection, diffusion)

Plot.plot({
  marks: [
    Plot.raster(data, {
        width: 100, 
        height: 50, 
        imageRendering: "pixelated",
        fill: d => d,
    }),
    Plot.frame()
  ],
  color: { scheme: "magma" },
  y: { label: "Time (t)" },
  x: { label: "Space (x)" }
})
```

In the visualization above:
- **X-Axis:** Represents 1D space across the screen.
- **Y-Axis:** Represents time flowing downwards.
- **Colour:** Represents light intensity.

As you increase **Advection**, the light streaks tilt more (moving faster across space).
As you increase **Diffusion**, the streaks blur (light scattering).

## Memory Architecture

To achieve 60 FPS in JavaScript, we avoid Objects. We use a **Structure of Arrays (SoA)** layout.

| Index (Offset) | Field | Description |
| :--- | :--- | :--- |
| `0` | `R` | Red Energy |
| `1` | `G` | Green Energy |
| `2` | `B` | Blue Energy |
| `4` | `VEL_X` | Momentum X |
| `5` | `VEL_Y` | Momentum Y |
| `12` | `SLEEP` | Optimisation Timer |

This allows us to process `200,000` pixels efficiently by keeping data local in the CPU cache.

## Conclusion

By combining **Ray Tracing** (for accurate initial placement) with **Fluid Dynamics** (for natural propagation), we create a lighting engine that feels organic and responsive, capable of running in a browser without WebGL shaders.
