# Fluid Light Transport Engine

A real-time hybrid rendering engine combining stochastic ray tracing with 2D cellular automata to simulate global illumination, soft shadows, and colour bleeding at 60 FPS.

## Quick Start

You can serve the static application using any of the following tools:

### Bun
```bash
bunx serve .
```

### npm / Node.js
```bash
npx serve .
```

### Python
```bash
python3 -m http.server 3000
```

Open the URL printed in your terminal (e.g. `http://localhost:3000`).

## Structure

```text
├── engine.js   # Physics solver & ray tracing loop
├── index.html  # Canvas shell & HUD overlay
├── style.css   # Styles & UI controls
└── assets/     # Scene configuration files
```

## Licence

Distributed under the [MIT Licence](LICENSE).
