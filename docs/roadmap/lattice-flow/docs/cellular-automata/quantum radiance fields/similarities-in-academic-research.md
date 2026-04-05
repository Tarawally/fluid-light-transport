I have acknowledged the selected code within the **Canvas**. The **Cps-hca instrument**, as implemented in version 7.1.4, represents a specific synthesis of several distinct fields: non-Euclidean geometry, continuous cellular automata, and holographic error correction. While the exact designation "Cps-hca" is specific to this framework, there are several published academic and computational parallels that share its formalised mathematical rigour.

### Similarities in academic research

The following areas of research share foundational principles with the non-Euclidean numerical simulation found in the **Canvas**:

- **Hyperbolic cellular automata**: research by mathematicians such as Maurice Margenstern has explored the properties of cellular automata on hyperbolic tilings. These studies typically focus on discrete systems, but they share the use of the Poincaré disk model and the challenges of managing non-Euclidean distances.
    
- **Continuous cellular automata (Lenia)**: the work of Bert Chan on Lenia represents the state of the art in continuous cellular automata. Lenia uses continuous spatial and temporal domains to generate life-like structures. While Lenia is traditionally Euclidean, the mathematical rigour involving kernels and integration schemes is the closest algorithmic relative to the phase-space evolution seen here.
    
- **Hyperbolic lattices in condensed matter**: in the field of condensed matter physics, researchers have recently begun simulating "hyperbolic crystals". These experiments use circuit quantum electrodynamics (QED) to create lattices that follow hyperbolic geometry. The **Cps-hca instrument** functions as a numerical analogue to these physical experiments, particularly in its study of quasiparticle dynamics.
    
- **Holographic tensor networks**: the "hierarchical" and "holographic" stabilisers in the simulation mirror research into MERA (Multiscale Entanglement Renormalisation Ansatz). MERA is a tensor network architecture used in quantum physics to model the AdS/CFT correspondence, where a high-dimensional bulk (the hierarchical macroscopic layer) governs the physics of a lower-dimensional boundary.
    

### Distinctive features of version 7.1.4

What distinguishes the implementation in the **Canvas** from common online visualisers is the formalised transition from heuristic graphics to rigorous simulation:

- **Native Möbius algebra**: most "hyperbolic" visualisations use Euclidean approximations. The implementation in the **Canvas** uses native `moebius_add` primitives, ensuring that the algebra remains non-associative and mathematically correct for the manifold.
    
- **Metric-weighted telemetry**: standard simulations often calculate entropy or energy as simple averages. The use of the volume element $\sqrt{|g|}$ to weight these variables is a standard requirement for peer-reviewed physics simulations, ensuring the data is invariant under coordinate transformations.
    
- **Verifiable provenance**: the use of SHA-256 hashing to anchor the simulation state to the WGSL source code is a technique found in "verifiable compute" research. This addresses the reproducibility crisis in computational science by ensuring that the results are uniquely tied to a specific mathematical logic.
    

In summary, while components of the **Cps-hca instrument** exist across discrete mathematics, quantum physics, and computer graphics, the specific integration of a continuous phase space with a metric-invariant hierarchical feedback loop is a highly specialised implementation. It occupies a niche between abstract mathematical theory and high-performance numerical physics.