---
title: Guided Technical Walkthrough
---

# Preface

This document provides a **Guided Technical Walkthrough** of the Hybrid Fluid-Light Transport engine.

Rather than focusing on jargon, we explore the underlying architecture. We build our understanding from the first principles of digital rasterisation to the complex simulation of non-linear light transport.

## Live Demo

<div class="tip">

### Interactive Demo

Experience the engine in real-time! Move your mouse to control the light source. Notice the soft shadows, colour bleeding, and ambient occlusion computed entirely through fluid simulation.

<a href="/" target="_blank"><strong>Open Full Screen Visualisation →</strong></a>

</div>

```js
const demoSimUrl = await FileAttachment("../src/index.html").url();

display(html`<iframe 
  id="demo-iframe"
  src="${demoSimUrl}"
  style="width: 100%; height: 75vh; border: 2px solid #333; border-radius: 8px; background: #000;"
  title="Fluid-Light Transport Demo"
  allowfullscreen>
</iframe>`);
```

<div class="note">

### Demo Troubleshooting

If the screen remains black, ensure you are viewing this through a web server (like `npm run docs:preview`). The engine requires `fetch()` to load scene data, which is often blocked on local `file://` access.

</div>

### Controls

- **WASD**: Move camera
- **Arrow Keys**: Look around
- **Left Click + Drag**: Rotate view
- **Right Click**: Move light source
- **Space**: Cycle visualisation modes

## The Graphics Dichotomy

In real-time computer graphics, we typically face a choice:

1. **Ray Tracing**: Offers extreme precision (like real-world light) but is computationally expensive, especially for soft, diffuse effects.
2. **Rasterisation**: The standard for games; it is incredibly fast but struggles with complex "global illumination" (how light bounces around).

This book explores a "third way": **Hybrid Fluid-Light Transport**. We treat light not merely as rays, but as a **fluid substance** that flows across the scene. This yields beautiful, organic lighting at a fraction of the cost.

## The Goal

We aim to demystify the following code:

```javascript
/**
 * @fileoverview Hybrid Fluid-Light Transport Engine.
 * This technique creates soft shadows, colour bleeding, and ambient occlusion
 * purely through 2D pixel-neighbour interactions.
 */
```

By the end of this book, you will understand exactly what that means and how to implement it.

## How to Read This Book

This book offers two complementary paths through the material. Please select your preferred path:

```js
const viewChoice = view(Inputs.radio(["Conceptual Journey", "Quick Reference"], {value: "Conceptual Journey", label: "Select Path:"}));
```

```js
${viewChoice === "Conceptual Journey" ? md`

Learn the architecture and algorithms from first principles:

**Foundation** (Chapters 1-3)
1.  [**The Digital Canvas**](tutorial/01-canvas) — Understanding the screen as a programmable grid
2.  [**The Language of Logic**](tutorial/02-logic) — JavaScript fundamentals for interactive graphics
3.  [**The Memory**](tutorial/03-memory) — Efficient data structures for real-time simulation

**Core Algorithms** (Chapters 4-7)
4.  [**The Mathematics**](tutorial/04-math) — Vector operations and spatial reasoning
5.  [**Ray Tracing**](tutorial/05-raytracing) — Geometric intersection and light injection
6.  [**Fluid Simulation**](tutorial/06-fluids) — Cellular automata for light propagation
7.  [**The Main Loop**](tutorial/07-mainloop) — Orchestrating the complete system

**Reference** (Chapters 8-9)
8.  [**Troubleshooting**](reference/troubleshooting) — Common issues and solutions
9.  [**API Reference**](reference/api) — Complete 1:1 code documentation
` : md`

Browse by topic or problem:

- **Getting Started**: [Chapter 1: Canvas](tutorial/01-canvas)
- **Understanding Vectors**: [Chapter 4: Math](tutorial/04-math#vectors-arrows-in-space)
- **Ray Tracing Basics**: [Chapter 5: Raytracing](tutorial/05-raytracing#reverse-ray-tracing)
- **Fluid Mechanics**: [Chapter 6: Fluids](tutorial/06-fluids#the-fluid-analogy)
- **Performance Issues**: [Chapter 8: Troubleshooting](reference/troubleshooting)
- **Complete API**: [Chapter 9: API Reference](reference/api)
`}
```

<div class="note">

### Documentation Sync

The [API reference](reference/api) is documentation for the simulation logic in `src/engine.js`.

</div>

## Road Map & Future Work

The Hybrid Fluid-Light Transport engine is under active development. Planned features include:

- **Refraction Support**: Bending light as it passes through different "fluid" densities.
- **Spectrum Simulation**: Splitting light into RGB wavelengths for chromatic aberration.
- **WebWorker Offloading**: Moving the heavy CA computation to a background thread to improve frame rates.

## Contributing

We welcome contributions! This documentation is built with [Observable Framework](https://observablehq.com/framework/). To contribute:

1. Clone the repository.
2. Install dependencies: `npm install`.
3. Edit `.md` files or the engine source in `src/`.
4. Preview changes: `npm run dev`.
5. Open a Pull Request.

---

[**Begin the Journey: Chapter 1 — The Digital Canvas →**](tutorial/01-canvas)

Let us begin our journey.

```js
// Sync theme to the embedded demo iframe reactively when the page theme changes
const iframe = document.getElementById("demo-iframe");
if (iframe) {
  const postTheme = () => {
    if (iframe.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'themechange',
        theme: dark ? 'dark' : 'light'
      }, '*');
    }
  };
  postTheme();
  iframe.addEventListener('load', postTheme);
}
```

```js
import {marked} from "npm:marked";
const md = (strings, ...values) => {
  const raw = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? values[i] : ""), "");
  const div = document.createElement("div");
  div.innerHTML = marked.parse ? marked.parse(raw) : marked(raw);
  return div;
};
```

```text

```
