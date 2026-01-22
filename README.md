# Hybrid Fluid-Light Transport Engine

> A high-performance fluid simulation engine that models light transport, integrated with a comprehensive "Docs as Code" technical walkthrough.

## Overview

This repository acts as a unified workspace containing two integrated components:
1.  **The Engine**: A JavaScript-based simulation that treats light as a fluid substance. It combines **Stochastic Ray Tracing** for photon injection with **Cellular Automata** for light propagation, creating soft shadows and ambient occlusion in real-time.
2.  **The Documentation**: A full interactive website built with [Quarto](https://quarto.org/) that explains the architecture from first principles using live code samples, interactive implementations, and flowcharts.

## Features

- **Hybrid Architecture**:
  - **Injection Phase**: Uses stochastic ray tracing to probe the scene and inject "photons" into a 2D grid.
  - **Propagation Phase**: Treats light as a fluid that moves based on surface roughness and depth topology.
- **Interactive "Docs as Code"**:
  - The documentation serves as the project's landing page.
  - Code snippets are annotated and linked directly to the source.
  - Interactive OJS widgets allow users to "play" with the math concepts.
- **Engineering Standards**: Includes automated unit testing with Vitest and CI/CD pipelines.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Quarto CLI](https://quarto.org/docs/get-started/)

### Installation

```bash
git clone https://github.com/Tarawally/fluid-light-transport.git
cd fluid-light-transport
npm install
```

### Development Workflow

**1. Run the Integrated Environment**
This launches the documentation site locally. The main simulation engine is embedded directly within the site.

```bash
quarto preview
```

**2. Run Unit Tests**
Validate the mathematical core of the engine using Vitest.

```bash
npm test
```

**3. Build for Production**
Generates the static site in the `_site/` directory.

```bash
quarto render
```

## Project Structure

- **`index.qmd`**: The project landing page and documentation entry point.
- **`app.html`**: The standalone "Full Screen" simulation application.
- **`src/`**: Shared source code for the engine (logic, rendering, solver).
- **`docs/tutorial/`**: Step-by-step technical walkthroughs (Fluid Dynamics, Ray Tracing).
- **`docs/reference/`**: API documentation (auto-generated) and Performance benchmarks.
- **`tests/`**: Unit tests ensuring engine reliability.

## Documentation

The technical walkthrough is designed to teach the concepts behind the code:

1.  **The Digital Canvas**: Understanding pixel manipulation.
2.  **The Logic**: Optimization patterns in JavaScript.
3.  **The Mathematics**: Vector operations and spatial reasoning.
4.  **Ray Tracing**: Geometric intersection and light injection.
5.  **Fluid Simulation**: Cellular automata for light propagation.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
