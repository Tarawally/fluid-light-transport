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

# Start the local development server
npm run dev
```

Once started, open your browser to the URL printed by Observable Framework (typically `http://localhost:3000/`).

---

## 🛠 NPM Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `observable preview` | Starts the local live-reloading dev preview server. |
| `npm run build` | `observable build` | Builds the production static site into `dist/`. |

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
├── .github/
│   └── workflows/
│       └── publish-docs.yml  # GitHub Actions deployment workflow
├── src/                      # Source root for Observable Framework
│   ├── index.md              # Documentation home page
│   ├── app.md                # Full-screen interactive simulation view
│   ├── introduction.md       # Guided overview & interactive demo
│   ├── assets/
│   │   └── scene.json        # Scene configuration JSON
│   ├── sim/                  # 60 FPS Standalone Simulation App
│   │   ├── index.html        # App entry point & canvas shell
│   │   ├── engine.js         # Core physics solver & ray tracing loop
│   │   ├── math_utils.js     # Vector math and normalisation helpers
│   │   ├── style.css         # UI styles and controls theme
│   │   └── theme-sync.js     # Dark/light theme sync listener
│   ├── reference/            # API reference, performance, and quality docs
│   └── tutorial/             # Architectural tutorial series
├── observablehq.config.js    # Observable Framework configuration (root: "src")
├── package.json
└── README.md
```

---

## 💡 Architecture & Design Notes

* **Sandboxed Simulation Engine:** The 60 FPS simulation (`src/sim/`) runs inside an `<iframe>` container. This isolates the CPU-heavy physics loop and 2D canvas rendering from Observable Framework's reactive runtime, preventing main-thread lag and CSS scope leakage.
* **Native Observable Integration:** All pages, tutorials, and benchmarks are compiled using standard Observable Framework conventions with zero custom build wrappers.

---

## 📜 License

Distributed under the [MIT License](LICENSE).
