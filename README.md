# Fluid Light Transport Engine

A real-time hybrid rendering engine combining stochastic ray tracing with 2D cellular automata (advection and diffusion) to simulate global illumination, soft shadows, and colour bleeding at 60 FPS.

Built with [Observable Framework](https://observablehq.com/framework/) and [Bun](https://bun.sh/).

---

## 🚀 Quick Start

### Prerequisites
* **[Bun](https://bun.sh/)** (v1.1 or higher)

### Local Development

```bash
bun install
bun run dev
```

Open `http://localhost:3000/` in your browser.

---

## 🛠 Project Commands

| Command | Description |
| :--- | :--- |
| `bun run dev` | Start the local preview server |
| `bun run build` | Build the static production site into `dist/` |
| `bun run clean` | Clear the local build cache |
| `bun run deploy` | Deploy the static site |

---

## 📁 Project Layout

```text
fluid-light-transport/
├── src/
│   ├── index.md        # Interactive documentation page
│   └── app/            # Standalone simulation engine & web application
│       ├── engine.js   # Physics solver & ray tracing loop
│       ├── index.html  # Canvas shell & HUD overlay
│       ├── style.css   # Styles & UI controls
│       └── assets/     # Scene configuration files
├── observablehq.config.js
├── package.json
└── README.md
```

---

## 📜 Licence

Distributed under the [MIT Licence](LICENSE).
