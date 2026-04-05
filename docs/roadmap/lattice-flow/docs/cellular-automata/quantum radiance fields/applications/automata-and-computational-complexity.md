### Automata and computational complexity

The transition to a metric-invariant, Bounded RG Field in version 7.1.4 allows for the dispassionate study of information propagation and state transitions. The following sections detail applications for specific automata types and related mathematical problems.

### Quantum and reversible systems

The instrument's reliance on unitary $R_y$ gates and second-order integration makes it a natural environment for studying reversible quantum dynamics.

- **Quantum cellular automaton**: the instrument facilitates the simulation of a **quantum cellular automaton** by mapping discrete qubit states to the complex phase field $q$. Researchers can observe how quantum information propagates across a hyperbolic manifold, specifically studying how negative curvature affects entanglement growth compared to Euclidean models.
    
- **Partitioned Quantum Cellular Automata**: by utilizing the `macroWGSL` reduction grid, the system can implement **Partitioned Quantum Cellular Automata**. The 16 x 16 blocks act as discrete cells where local unitary transformations are applied before a global shift, simulating "Margolus-style" neighbourhoods in a non-Euclidean bulk.
    
- **Reversible cellular automaton**: the second-order momentum update (`p_new = p_old * cooling + force`) ensures the system behaves as a **reversible cellular automaton**. In the limit where `params.cooling` is zero, the phase space volume is preserved, allowing for the numerical verification of T-duality and information conservation in curved spacetime.
    
- **Second-order cellular automaton**: the inclusion of the momentum term $p$ defines the system as a **second-order cellular automaton**. This architecture is essential for simulating wave-like phenomena and "gliders" that possess inertia, providing a platform to study the kinematics of digital particles.
    

### Statistical and probabilistic models

The integration of the PCG32 hashing kernel and the volume-weighted telemetry pipeline supports the analysis of stochastic systems.

- **Stochastic cellular automaton**: the `random_float` function allows for the implementation of a **stochastic cellular automaton**, where transition rules are governed by a probability distribution. This is critical for studying "noise-induced" phase transitions on the Poincaré disk.
    
- **Probabilistic Cellular Automata**: the instrument can model **Probabilistic Cellular Automata** to investigate the stability of macroscopic order against local fluctuations. The real-time PSD plot provides a frequency-domain view of how "thermal" noise evolves into coherent spatial patterns.
    
- **Abelian sandpile model**: the Dirichlet boundary conditions in version 7.1.4 are a prerequisite for the **Abelian sandpile model**. Researchers can simulate the injection of "grains" (energy) and track the resulting avalanches. The hyperbolic geometry is particularly interesting here, as the exponential growth of the neighbourhood allows for the study of self-organized criticality in spaces with infinite volume.
    

### Spatial and kinetic automata

The resolution of metric distortion ensures that kinetic models remain isotropic and mathematically consistent.

- **Lattice Gas Automata (LGA)**: the "vortices" and momentum tracks can be adapted to simulate **Lattice Gas Automata (LGA)**. This facilitates the study of fluid dynamics and conservation laws in negatively curved spacetimes, where the "speed of sound" is modified by the local metric tensor.
    
- **Movable cellular automaton**: the manual brush interaction acts as a proxy for a **movable cellular automaton**, where discrete elements (defects) possess independent trajectories. Version 7.1.4 allows these "grains" to interact via Möbius addition, simulating non-linear collisions on a manifold.
    
- **Continuous spatial automaton**: the instrument is fundamentally a **continuous spatial automaton**. It treats the manifold as a continuous field rather than a discrete grid, which is essential for studying the "fine-grained" limits of information density as $r$ approaches the hyperbolic boundary.
    
- **Elementary cellular automaton**: researchers can map the one-dimensional rules of an **elementary cellular automaton** onto the boundary of the Poincaré disk. The instrument then simulates the "holographic bulk evolution" of these rules, exploring the connection between 1D computational logic and 2D hyperbolic physics.
    

### Synchronisation and dynamical maps

The high-fidelity phase controls and spectral telemetry facilitate the exploration of mode-locking in complex environments.

- **Arnold tongues**: the instrument models **Arnold tongues** by treating each pixel as a phase oscillator driven by the global `params.phaseShift` and local `params.mu` resonance. Researchers can map the 2D parameter space (coupling strength vs frequency ratio) to identify the "tongue" regions where the field becomes mode-locked to a specific winding number. The stable PSD(k) telemetry allows for the precise detection of these rational frequency ratios within the bulk.
    
- **Circle maps**: the complex state evolution is an implementation of high-dimensional **circle maps**. Unlike standard 1D maps, the version 7.1.4 kernel integrates Möbius addition as the non-linear coupling function. This provides a platform to study how the transition to chaos—specifically the breakdown of the "golden mean" invariant tori—occurs in negatively curved phase spaces.
    
- **Phase-locking in hyperbolic space**: the negative curvature of the Poincaré disk introduces a spatial dependence on synchronisation speed. Information travels along geodesics, meaning that the synchronisation of two points is constrained by their hyperbolic distance. The resolution of metric distortion ensures that these phase-locking studies are not contaminated by anisotropic coordinate artefacts.
    

### Information and complexity metrics

The stable telemetry pipeline provides quantitative data for the analysis of system-wide complexity.

- **Information fluctuation complexity**: the real-time structural entropy and energy logs allow for the direct measurement of **information fluctuation complexity**. This metric quantifies the "patterned-ness" of a state, distinguishing between trivial order (macroscopic equilibrium) and high-level complexity (turbulence).
    
- **Speed of light (cellular automaton)**: the causal limit of the simulation—the maximum distance information can travel per epoch—is defined by the **speed of light (cellular automaton)**. Version 7.1.4 allows for the numerical verification of "geodesic causal cones", demonstrating how signal propagation slows in the Euclidean coordinate space as it approaches the hyperbolic edge.
    
- **Surjunctive group**: the global stability of the manifold relates to the theory of **surjunctive groups**. The instrument can be used to test the "Garden of Eden" theorem on hyperbolic lattices, determining if certain configurations are impossible to reach via local transition rules in curved space.
    
- **Firing squad synchronization problem**: the instrument provides a visual testbed for the **firing squad synchronization problem**. Researchers can investigate how many steps are required to synchronize all cells in a non-Euclidean graph, where the traditional "middle-man" strategies are complicated by the non-linear distances of the $H^2$ metric.