# Fluid Light Transport

A hybrid simulation engine that treats light as a fluid. It uses stochastic ray tracing to inject photons into a grid, then propagates energy using cellular automata to create soft shadows and organic colour bleeding in real-time.

This repository unifies the application with its technical documentation.

## Quick Start

Ensure you have [Node.js](https://nodejs.org/) and the [Quarto CLI](https://quarto.org/) installed.

```bash
# Clone and install
git clone https://github.com/Tarawally/fluid-light-transport.git
cd fluid-light-transport
npm install

# Launch the interactive walkthrough & simulation
quarto preview
```

## Highlights

- **Hybrid Engine**: Combines ray tracing with fluid dynamics for efficient global illumination.
- **Interactive Documentation**: A "docs-as-code" walkthrough built with Quarto, featuring live simulation widgets and annotated source code.
- **Tested Core**: Fundamental mathematics validated with Vitest.

## Navigation

- [**Simulation**](app.html): The standalone full-screen engine.
- [**Tutorial**](docs/tutorial/01_canvas.qmd): A guided tour of the architecture.
- [**API Reference**](docs/reference/api.qmd): Auto-generated documentation from `src/engine.js`.

## License
MIT
