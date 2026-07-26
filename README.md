# Fluid Light Transport Engine

A hybrid rendering engine that treats light as a fluid substance. It combines stochastic ray tracing with 2D fluid dynamics (cellular automata advection and diffusion) to simulate organic global illumination, soft shadows, and color bleeding in real-time at 60 FPS.

This repository unifies the core simulation engine with an interactive documentation platform built using [Observable Framework](https://observablehq.com/framework/).

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v20 or higher)
* `npm` (v10 or higher)

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/Tarawally/fluid-light-transport.git
cd fluid-light-transport

# Install dependencies
npm install

# Start the interactive development server
npm run docs:preview
```

Once started, open your browser to **[http://127.0.0.1:3000/](http://127.0.0.1:3000/)**.

---

## 🛠 Available NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run docs:preview` | `node docs/scripts/preview-server.js` | Starts the unified development proxy on **port 3000**, serving both Observable Framework documentation and raw static simulation assets (`/src/`, `/assets/`). |
| `npm run docs:build` | `observable build && cp ...` | Builds the production site into `dist/` and copies static engine assets (`src/` and `assets/`) for static hosting. |
| `npm run docs:api` | `node docs/scripts/build-api.js` | Auto-generates `docs/reference/api.md` from JSDoc comments in `src/engine.js`. |
| `npm test` | `vitest run` | Runs unit tests for math utilities (`tests/math.test.js`). |
| `npm run test:watch` | `vitest` | Runs Vitest unit test suite in watch mode for active development. |

---

## 🔬 How It Works

The engine pipeline operates in two distinct phases:

1. **Ray Tracing Phase (Injection):** Stochastic ray casting probes scene geometry and injects energy (photons) into a screen-space grid at the first surface hit point.
2. **Fluid Dynamics Phase (Propagation):**
   * **Advection:** Light momentum moves energy across neighboring cells.
   * **Diffusion:** Light spreads softly into adjacent pixels to create soft shadows.
   * **Depth Discontinuity Protection:** Checks scene depth buffers to prevent light bleeding across disconnected surfaces.

---

## 📁 Repository Structure

```text
fluid-light-transport/
├── src/                      # Standalone 60 FPS simulation engine app
│   ├── engine.js             # Core physics solver & ray tracing loop
│   ├── index.html            # Standalone app entry point & iframe shell
│   ├── math_utils.js         # Vector math and normalisation helpers
│   ├── style.css             # UI styles and controls theme
│   └── theme-sync.js         # Observable dark/light theme sync listener
├── assets/                   # Shared scene configuration JSON and presets
├── docs/                     # Observable Framework documentation site
│   ├── app.md                # Full-screen interactive simulation view
│   ├── index.md              # Documentation home page
│   ├── introduction.md       # Guided overview & interactive demo
│   ├── reference/            # API reference, performance, and quality docs
│   ├── scripts/
│   │   ├── preview-server.js # Development proxy server (port 3000)
│   │   └── build-api.js      # JSDoc generator script
│   └── tutorial/             # Multi-part architectural tutorial series
├── tests/
│   └── math.test.js          # Vitest unit test suite
├── observablehq.config.js    # Observable Framework configuration
└── package.json
```

---

## 💡 Architecture & Design Notes

* **Sandboxed Simulation Engine:** The 60 FPS simulation (`src/`) runs inside an `<iframe>` container. This isolates the CPU-heavy physics loop and 2D canvas rendering from Observable Framework's reactive runtime, preventing main-thread lag and CSS scope leakage.
* **Unified Local Server:** `preview-server.js` serves documentation pages while routing static asset requests (`/src/index.html`, `/assets/scene.json`) directly from disk without router transformations.

---

## 📜 License

Distributed under the [MIT License](LICENSE).
