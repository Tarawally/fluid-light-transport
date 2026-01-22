# Hybrid Fluid-Light Transport Engine

> A high-performance fluid simulation that models light as a liquid, complete with a guided technical walkthrough.

## Overview

This project unites a novel graphics engine with its own interactive textbook.

1.  **The Engine**: A JavaScript simulation that treats light as a fluid. By mixing **Ray Tracing** (for accuracy) with **Cellular Automata** (for flow), it produces beautiful soft shadows and colour bleeding in real-time.
2.  **The Documentation**: A fully interactive website that explains the magic. It builds the system from scratch, using live diagrams and code to teach you the architecture.

## Key Features

- **Hybrid Rendering**: Probes the scene with rays, then propagates light like a liquid across the screen.
- **Interactive "Docs as Code"**: The documentation *is* the application. Code snippets link straight to the source, and interactive widgets let you adjust the maths in real-time.
- **Solid Engineering**: Built with automated testing and continuous integration to ensure reliability.

## Getting Started

### Prerequisites

You will need [Node.js](https://nodejs.org/) (v18 or newer) and the [Quarto CLI](https://quarto.org/docs/get-started/).

### Installation

```bash
git clone https://github.com/Tarawally/fluid-light-transport.git
cd fluid-light-transport
npm install
```

### How to Run It

**1. Launch the Environment**
This command starts a local server. You can view both the documentation and the simulation in your browser.

```bash
quarto preview
```

**2. Run the Tests**
Check that the core mathematics are working correctly.

```bash
npm test
```

**3. Build options**
Generate the static website in the `_site/` folder.

```bash
quarto render
```

## Project Structure

- **`index.qmd`**: The main entry point for the documentation.
- **`app.html`**: The full-screen simulation.
- **`src/`**: The engine's source code (logic, rendering, and solver).
- **`docs/tutorial/`**: The guided chapters (Fluid Dynamics, Ray Tracing, etc.).
- **`docs/reference/`**: Auto-generated API docs and performance benchmarks.
- **`tests/`**: Unit tests for the engine.

## The Walkthrough

We have designed the documentation to be read like a book:

1.  **The Digital Canvas**: How we draw to the screen.
2.  **The Logic**: Writing fast, optimised JavaScript.
3.  **The Mathematics**: Vectors and spatial reasoning made simple.
4.  **Ray Tracing**: Finding where the light hits.
5.  **Fluid Simulation**: Making the light flow.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
