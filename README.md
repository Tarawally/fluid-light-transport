# Hybrid Fluid-Light Transport Engine

A JavaScript-based simulation engine that models light as a fluid substance. It combines **Stochastic Ray Tracing** for photon injection with **Cellular Automata** for light propagation, creating soft shadows, colour bleeding, and ambient occlusion in real-time without expensive global illumination calculations.

## Features

- **Hybrid Architecture**:
  - **Injection Phase**: Uses stochastic ray tracing to probe the scene and inject "photons" into a 2D grid.
  - **Propagation Phase**: Treats light as a fluid that advects and diffuses based on surface roughness and depth topology.
- **Real-time Performance**: Optimised to run in the browser using HTML5 Canvas and Typed Arrays.
- **Dynamic Interactions**: Move the camera and light sources in real-time.
- **Visual Analysis**: Switch between Composite, Active Tile Map, and Velocity Vector Field views.

## Getting Started

### Prerequisites

You need a modern web browser (Chrome, Firefox, Safari, Edge) with JavaScript enabled.

### Installation & Running

Since this project uses ES6 modules and `fetch` for loading assets, it **cannot** be run directly from the file system (e.g., `file:///path/to/index.html`) due to CORS security policies. You must serve it via a local web server.

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/fluid-light-transport.git
    cd fluid-light-transport
    ```

2.  **Start a local server**:

    - **Using Python 3**:
      ```bash
      python3 -m http.server
      ```
    - **Using Node.js (`http-server`)**:
      ```bash
      npx http-server
      ```
    - **Using VS Code**:
      Install the "Live Server" extension and click "Go Live".

3.  **Open the application**:
    Navigate to `http://localhost:8000` (or the port shown by your server) in your browser.

## Controls

| Key / Action           | Function                                                 |
| :--------------------- | :------------------------------------------------------- |
| **W A S D**            | Move Camera (Forward/Left/Back/Right)                    |
| **Arrow Keys**         | Look Around (Yaw/Pitch)                                  |
| **Space**              | Cycle Visualisation Modes (Composite, Heatmap, Velocity) |
| **Left Click + Drag**  | Rotate Camera                                            |
| **Right Click + Drag** | Move Light Source                                        |

## Documentation

Comprehensive documentation on the architecture, data pipeline, and performance constraints can be found in the [Guided Technical Walkthrough](docs/index.qmd).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
