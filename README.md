# Fluid Light Transport Engine

A real-time hybrid rendering engine combining stochastic ray tracing with 2D cellular automata (advection and diffusion) to simulate global illumination, soft shadows, and colour bleeding at 60 FPS.

Built with Vanilla JS and served via [Bun](https://bun.sh/).

---

## 🚀 Quick Start

### Prerequisites
* **[Bun](https://bun.sh/)** (v1.1 or higher) or **Node.js**

### Local Development

```bash
bun run dev
```

Open the printed localhost URL in your browser (usually `http://localhost:3000/`).

---

## 🛠 Project Commands

| Command | Description |
| :--- | :--- |
| `bun run dev` | Start the local development server |

---

## 📁 Project Layout

```text
fluid-light-transport/
├── engine.js   # Physics solver & ray tracing loop
├── index.html  # Canvas shell & HUD overlay
├── style.css   # Styles & UI controls
├── assets/     # Scene configuration files
├── package.json
└── README.md
```

---

## 📜 Licence

Distributed under the [MIT Licence](LICENSE).
