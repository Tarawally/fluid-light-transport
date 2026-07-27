# Fluid Light Transport Engine

A hybrid rendering engine that treats light as a fluid substance. It combines stochastic ray tracing with 2D fluid dynamics (cellular automata advection and diffusion) to simulate organic global illumination, soft shadows, and colour bleeding in real-time at 60 FPS.

This repository unifies the core simulation engine with an interactive documentation platform built using [Observable Framework](https://observablehq.com/framework/).

---

## 🚀 Quick Start

### Prerequisites
* **[Bun](https://bun.sh/)** (v1.1 or higher, recommended) or **[Node.js](https://nodejs.org/)** (v20 or higher)
* `npm` (v10 or higher, if using Node.js)

### Installation & Local Development

```bash
# Clone the repository
git clone https://github.com/Tarawally/fluid-light-transport.git
cd fluid-light-transport

# Using Bun (Recommended)
bun install
bun run dev

# Or using NPM
npm install
npm run dev
```

Once started, open your browser to the URL printed by Observable Framework (typically `http://localhost:3000/`).

---

## 🛠 Project Scripts

| Script | Command (Bun) | Command (NPM) | Description |
| :--- | :--- | :--- | :--- |
| `dev` | `bun run dev` | `npm run dev` | Starts the local live-reloading preview server. |
| `build` | `bun run build` | `npm run build` | Builds the static production documentation site into `dist/`. |

---

## 🔬 How It Works

The engine pipeline operates in two distinct phases:

1. **Ray Tracing Phase (Injection):** Stochastic ray casting probes scene geometry and injects energy (photons) into a screen-space grid at the first surface hit point.
2. **Fluid Dynamics Phase (Propagation):**
   * **Advection:** Light momentum moves energy across neighbouring cells.
   * **Diffusion:** Light spreads softly into adjacent pixels to create soft shadows.
   * **Depth Discontinuity Protection:** Checks scene depth buffers to prevent light bleeding across disconnected surfaces.

---

## 📁 Repository Structure

```text
fluid-light-transport/
├── .github/
│   └── workflows/
│       └── publish-docs.yml  # GitHub Actions deployment workflow
├── src/                      # Core Simulation Engine Source Code
│   ├── engine.js             # Core physics solver & ray tracing loop
│   ├── math_utils.js         # Vector math and normalisation helpers
│   ├── index.html            # Canvas shell & HUD overlay
│   ├── style.css             # UI styles and controls theme
│   ├── theme-sync.js         # Dark/light theme sync listener
│   └── assets/
│       └── scene.json        # Scene configuration JSON
├── docs/                     # Observable Framework Documentation Root
│   ├── index.md              # Documentation home page
│   ├── app.md                # Full-screen interactive simulation view
│   ├── introduction.md       # Guided overview & interactive demo
│   ├── reference/            # API reference, performance, and quality docs
│   └── tutorial/             # Architectural tutorial series
├── observablehq.config.js    # Observable Framework configuration (root: "docs")
├── bun.lock                  # Bun lockfile
├── package.json
└── README.md
```

---

## 💡 Architecture & Design Notes

* **Sandboxed Simulation Engine:** The 60 FPS simulation (`src/`) runs inside an `<iframe>` container embedded in Observable pages. This isolates the CPU-heavy physics loop and 2D canvas rendering from Observable Framework's reactive runtime, preventing main-thread lag and CSS scope leakage.
* **Native Observable Integration:** All documentation pages, tutorials, and benchmarks in `docs/` are compiled using standard Observable Framework conventions.

---

## 📜 License

Distributed under the [MIT License](LICENSE).
