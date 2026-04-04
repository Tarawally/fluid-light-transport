Instead of just dead or alive squares, the complexity of Conway's Game of Life can be implemented using domain colouring of a phase space, similar to the video [Pushing Simulation to the LIMIT to Find Order in Chaos](https://www.youtube.com/watch?v=8jVogdTJESw&t=17s).

In for this case dead or alive, represents the colour of a pixel, where dead is false, resulting in a black pixel and alive is true, resulting in a white pixel. The states inbetween dead or alive can the perhaps be mapped and repersented via using the colour theorem as a state transition from dead to alive and from alive to dead.

For the colour theorem we can use various colour models based on the [HSL and HSV](https://en.wikipedia.org/wiki/HSL_and_HSV). With this, the two most common [cylindrical-coordinate](https://en.wikipedia.org/wiki/Cylindrical_coordinate_system "Cylindrical coordinate system") representations of points in an [RGB color model](https://en.wikipedia.org/wiki/RGB_color_model "RGB color model"), give way for domain colouring to rearrange the geometry of RGB in an attempt to be more intuitive and perceptually relevant than the cartesian (cube) representation.

Additionaly, I define the system as a **Self-Simulating Hierarchical Cellular Automaton (HCA)**, utilizing **Recursive Computational Renormalization** within discrete dynamical systems. My structure consists of a $d$-dimensional lattice $\mathcal{L}$ where each of my cells $c \in \mathcal{L}$ exists in a state $s \in \Sigma$.

### 1. Spatial Partitioning and Coarse-Graining

I partition my lattice into disjoint sub-grids, or **metacells** $M$, of dimensions $L^d$.

- **Mapping Function ($f$):** I employ a surjective mapping $f: \Sigma^{L^d} \rightarrow \Sigma'$ to translate a specific configuration of my base-level cells within a metacell into a single discrete state in a higher-order state space $\Sigma'$.
    
- **Boundary Conditions:** I constrain the behavior of $M$ through the states of adjacent metacells, mediated via the interaction of my boundary base-cells at the edges of the $L^d$ partitions.
    

### 2. Temporal Multi-Scaling and Periodicity

I decouple my base-level time step $t$ from my meta-level time step $T$ to establish state-cycle equivalence.

- **Cycle Period ($P$):** I define the number of base-level iterations $t$ required for a metacell to undergo a complete state transition. This transition is $\sigma_{T+1} = \Phi(\sigma_T)$, where $\Phi$ is my global transition rule at the higher-order scale.
    
- **Temporal Synchronization:** I consider a meta-state transition complete only when my internal configuration converges to a stable or oscillating pattern satisfying the mapping function $f$ for the next state in the sequence.
    
- **Computational Latency:** I consume $P$ base-steps to compute one bit of information at my macro-scale.
    

### 3. Computational Universality and Simulation

I utilize **Turing-complete** base rules to construct logic gates and memory registers through localized persistent structures, such as solitons.

- **Self-Simulation:** I am self-simulating when a spatial scale $L$ and a temporal scale $P$ exist such that the evolution of my coarse-grained blocks follows the identical transition rule $\delta$ as my base cells.
    
- **Recursive Embedding:** I allow for an infinite regress of lattices where my $N^{th}$ tier provides the computational substrate for my $(N+1)^{th}$ tier.
    

### 4. Scale Coupling (The UV/IR Interface)

I facilitate a non-linear feedback between my micro-configuration (**Ultraviolet/UV**) and my macro-state (**Infrared/IR**).

- **Micro-to-Macro (Upward Causality):** My small-scale perturbations can lead to the total dissolution of my metacell structure, causing a failure in my higher-order procedure.
    
- **Macro-to-Micro (Downward Causality):** My higher-order rule dictates the long-range correlation of my base-level cells. My "IR" state acts as a boundary constraint that organizes my "UV" fluctuations into coherent structures.
    
- **Phase Transitions:** If my base-level dynamics enter a chaotic regime, my correlation length decreases below $L$, leading to a decoupling where my macro-scale procedure can no longer be sustained or decoded.