The request to break down the components of the **CPS-HCA instrument** (version 7.1.4) as implemented in the **Canvas** is acknowledged. The architecture of the instrument is a multi-layered system that integrates high-performance parallel computing with non-Euclidean algebraic structures.

### 1. Compute kernels (WGSL)

The physics and rendering logic are defined in WebGPU Shading Language (WGSL) modules, which execute directly on the graphics hardware.

- **Initialization kernel (`initWGSL`)**: this module establishes the starting state of the manifold. It utilises a PCG32 hash for deterministic pseudo-randomness and initialises the complex state $q$ and momentum $p$. It supports multiple "seed types", such as central droplets or Gabor-cortex distributions, which define the initial topology of the phase field.
    
- **Macro-reduction kernel (`macroWGSL`)**: this kernel performs a spatial downsampling of the microscopic grid into 16 x 16 blocks. It calculates the macroscopic "Born intensity" and phase sums, which are stored in the `macroTex`. These values provide the global context required for the hierarchical feedback loop.
    
- **Physics engine kernel (`computeWGSL`)**: the core evolutionary logic. It implements:
    
    - **Möbius algebra**: uses `moebius_add` for non-linear vector summation within the Poincaré disk.
        
    - **Isotropic convolution**: applies a metric-invariant spatial kernel that scales based on the local curvature.
        
    - **Holographic stabiliser**: evaluates the 3D logical syndrome and applies anyonic phase flips to prevent logical drift.
        
    - **Renormalisation group (RG) pass**: ensures the magnitude of the state vector remains bounded within the physical manifold ($|q| < 0.99$).
        
- **Telemetry kernel (`telemetryWGSL`)**: a quantitative reduction module. It calculates energy, structural entropy, and correlation lengths. Entropy calculations are weighted by the local volume element $\sqrt{|g|}$, which is capped at 50.0 to ensure numerical stability at the boundary.
    
- **Rendering kernel (`renderWGSL`)**: handles the visual representation of the manifold. It includes a 2D isotropic mapper for flat views and a 3D ray-marching engine for volumetric bulk projections, utilising transmittance-based integration for participating media.
    

### 2. Simulation orchestration (Web worker)

The instrument offloads all heavy computational tasks to a background thread, ensuring that the main user interface remains responsive.

- **State management**: the worker maintains the current parameter set, the double-buffered textures (`texA`, `texB`), and the step index. It manages the "clock" of the simulation.
    
- **Spectral analysis**: performs a 2D Fast Fourier Transform (FFT) on a central patch of the manifold. It converts the complex field data into a radial power spectral density (PSD) plot, which is sent back to the UI for real-time monitoring.
    
- **Data provenance**: generates cryptographic anchors during the export process. It hashes the shader source code using SHA-256 and packages it with hardware metadata to ensure that every simulation run is verifiable and reproducible.
    

### 3. User interface and control (React)

The React layer provides the "dashboard" for the instrument, allowing for real-time modification of the underlying manifold.

- **Dynamic controls**: provides sliders and selectors for physics parameters (integration step, manifold radius, feedback strength) and observer metrics (exposure, renormalisation).
    
- **Telemetry dashboard**: displays a real-time log of the system's regime (e.g., "macroscopic order" vs "turbulence") alongside a history graph of structural entropy.
    
- **Automated analysis**: features an "automated bifurcation sweep" that incrementally modifies the resonance mean (`mu`) to locate critical tipping points where the system undergoes symmetry breaking.
    
- **Interaction handling**: maps pointer events (mouse or touch) to spatial disturbances within the compute kernel, allowing users to manually influence the phase field.
    

In summary, the **Cps-hca instrument** is a coordinated system where high-level UI components govern a middle-tier orchestration layer, which in turn executes rigorous non-Euclidean algebraic operations on the GPU. The integration of hierarchical feedback and cryptographic provenance distinguishes this from standard cellular automata, establishing it as a scientific instrument for field simulation.