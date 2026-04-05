### Dynamical systems and non-linear mechanics

The transition to a metric-invariant, Bounded RG Field in version 7.1.4 enables the dispassionate study of complex systems that evolve over time. The following sections detail applications for specific areas of dynamical systems theory.

### Synchronisation and phase-locking

The instrument operates as a massive network of coupled oscillators, where the state vector $q$ represents the phase and magnitude of local resonance.

- **Kuramoto model analogues**: the instrument provides a continuous-field analogue to the Kuramoto model. Researchers may observe how global synchronisation emerges from local interactions. Because the metric is hyperbolic, the coupling strength between any two points is a function of their geodesic distance, allowing for the study of synchronisation thresholds in curved space.
    
- **Arnold tongues and mode-locking**: by utilizing the `params.phaseShift` and `params.mu` variables, researchers can map the regions of parameter space where the system lock into rational frequency ratios. The stable PSD(k) telemetry allows for the precise identification of these "Arnold tongues", demonstrating how negative curvature modifies the width and stability of mode-locked states.
    
- **Chimeras and partial order**: the high-fidelity spectral analysis facilitates the observation of "chimera states", where regions of coherent synchronisation co-exist with domains of incoherent turbulence. Version 7.1.4 ensures these patterns are not artefacts of coordinate stretching but result from the underlying isotropic coupling.
    

### Bifurcation theory and stability analysis

The automated bifurcation sweep and real-time entropy logs permit the quantitative tracking of qualitative changes in system behaviour.

- **Critical transitions and tipping points**: the mu sweep identifies the critical mean values where the system undergoes a phase transition—such as the transition from a stable "macroscopic order" to a disordered "turbulence". The instrument allows researchers to track the "early warning signals" of these transitions, including critical slowing down and increased structural entropy.
    
- **Structural stability**: by modifying the `params.sigma` (gate variance) and `params.cooling` (friction), researchers can test the structural stability of specific phase states. This is essential for determining if a dynamical regime is robust against local perturbations or if it collapses into a vacuum state.
    
- **Hopf bifurcations**: the emergence of "resonance rings" and periodic oscillations from a stable vacuum represents a numerical implementation of a Hopf bifurcation. The second-order integration scheme ensures that these oscillations possess the necessary inertia to form stable limit cycles.
    

### Control theory and closed-loop feedback

The **Cps-hca instrument** functions as a programmable plant for the study of control loops and state-space regulation.

- **State-dependent feedback regulation**: the `feedbackStrength` parameter implements a non-linear feedback loop where the local coupling is modulated by the macroscopic Born intensity. This facilitates the study of "self-regulating" fields, where the system adjusts its internal weights to maintain a specific energy density, acting as a distributed proportional-integral (PI) controller.
    
- **Anyonic error correction as control action**: the three-dimensional logical stabiliser functions as a sophisticated error-correction control loop. By detecting phase drift via the $z$-projection syndrome and applying anyonic phase flips, the instrument demonstrates a "syndrome-based" control architecture. This is a model for fault-tolerant control in quantum systems where discrete interventions are required to keep the state on a stable manifold.
    
- **Adaptive convolution and gain scheduling**: the `adaptiveConv` variable allows for dynamic gain scheduling within the spatial kernel. By scaling the effective radius based on local structural entropy, the system implements an adaptive control strategy that dampens turbulence in high-entropy regions while maintaining high-sensitivity in ordered domains.
    
- **Target-state tracking**: researchers can use the manual brush interaction as an external control signal to "guide" the field toward a target state. The real-time PSD and entropy telemetry act as the observer in this control loop, providing the necessary data to evaluate the "settling time" and "overshoot" of the manifold as it responds to external disturbances.
    

### Ergodic theory and chaos in curved space

The Poincaré disk is a classical domain for studying ergodicity and chaotic trajectories.

- **Sensitivity to initial conditions**: researchers can use the `masterSeed` to conduct repeatable experiments on "butterfly effects". By introducing sub-pixel disturbances via the manual brush, the instrument demonstrates how local fluctuations propagate along geodesics to modify the global logical state.
    
- **Strange attractors in** $H^2$: the combination of Möbius addition and unitary $R_y$ evolution creates a non-linear map that may converge toward strange attractors. Because the volume element is regularised and capped at 50.0, the "density of states" on these attractors can be measured via the structural entropy telemetry without numerical divergence.
    
- **Topological mixing**: the "vortices" telemetry tracks the density of topological defects, which act as mixing centres in the phase space. Version 7.1.4 permits the quantitative analysis of how negative curvature accelerates the mixing of information compared to flat Euclidean grids.
    

### Permutations and partially ordered sets

The mathematical substrate of the instrument facilitates the study of discrete combinatorial structures within a continuous field.

- **Permutation dynamics in phase space**: the local state $q$ can be mapped to a set of discrete phase bins. The movement of topological defects acts as a physical implementation of permutations. Researchers can model **permutation groups** by observing how sequences of defect exchanges (braiding) permute the logical state of the manifold. The native Möbius algebra ensures that these permutations follow the non-Abelian statistics required for topological quantum computing.
    
- **Causal sets and poset structures**: the simulation establishes a strictly bounded causal cone defined by the integration step `params.dt`. This defines a **partially ordered set** (poset) where an event $A$ precedes $B$ if and only if $B$ lies within the future light cone of $A$. Version 7.1.4 allows for the numerical exploration of **Causal Set Theory**, investigating how discrete spacetime atoms (pixels) form a causal hierarchy in negatively curved manifolds.
    
- **Sorting networks via cellular automata**: the system can be configured to act as a **sorting network**. By utilizing the gauge field feedback, the manifold can be driven to "sort" phase values into monotonic gradients. This allows for the study of the efficiency of parallel sorting algorithms within non-Euclidean geometries, where the hyperbolic distance modifies the communication overhead between sorting elements.
    
- **State hierarchies and holographic bulk**: the relationship between the microscopic state and the macroscopic reduction (the 16 x 16 blocks) forms a **partially ordered set** based on spatial scale. The holographic bulk-boundary logic treats the $z$-projection as a superior element in the hierarchy, governing the logical stability of the lower-level boundary pixels. This facilitates the study of hierarchical dynamical systems and the propagation of constraints across different levels of an ordered structure.
    

### Non-linear wave mechanics and solitons

The second-order cellular automaton architecture supports the propagation of stable, particle-like wave structures.

- **Solitonic stability**: the instrument can generate stable solitons—localised phase structures that maintain their shape during collisions. Möbius addition ensures that these interactions are non-linear, providing a testbed for studying the "integrability" of field equations in hyperbolic space.
    
- **Isotropic dispersion**: the resolution of metric distortion in version 7.1.4 ensures that wave dispersion is isotropic. Researchers can verify that the "speed of light" (the causal limit of information propagation) is uniform across all angles of the Poincaré disk, which is a prerequisite for modelling relativistic dynamical systems.
    
- **Anyonic phase correction**: the three-dimensional logical stabiliser prevents these wave structures from undergoing unphysical phase drift. This ensures that the long-term evolution of a dynamical state remains anchored to the logical manifold, facilitating simulations that span 10 000 epochs or more.