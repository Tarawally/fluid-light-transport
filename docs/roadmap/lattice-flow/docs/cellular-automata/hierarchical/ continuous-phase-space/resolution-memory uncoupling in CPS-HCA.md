# Research notes: resolution-memory uncoupling in CPS-HCA

**Date:** 1 April 2026

**Subject:** Technical strategies for the mitigation of $O(N^3)$ VRAM scaling and the implementation of non-Archimedean transport architectures.

## Executive summary

The primary computational bottleneck in the continuous phase space – hierarchical cellular automata (CPS-HCA) framework is the $O(N^3)$ memory occupancy mandated by dense volumetric discretisation. Scaling beyond $256^3$ resolution requires a transition to sparse, non-Archimedean, and holographic architectural paradigms. These methodologies effectively uncouple the simulation's spatial resolution from static memory capacity by prioritising occupancy-driven allocation, number-theoretic proceduralism, and algebraic representation.

## Unified field-centric transport architecture (UFTA)

Scaling is facilitated by the **unified field-centric transport architecture** (UFTA), a computational framework that replaces pluralistic physical solvers with an integrated field substrate.

- **Monistic substrate:** the UFTA dissolves the schism between matter, radiance, and information, treating them as interchangeable modalities of a singular transport process.
    
- **Geometric-arithmetic integration:** the architecture utilises non-Euclidean manifolds—specifically p-adic and hyperbolic structures—to resolve high-dimensional interactions without explicit geometric intersection tests.
    
- **Topological protection:** structural stability of emergent features, including vortex filaments and solitons, is maintained through the rigorous enforcement of topological invariants such as winding numbers and Betti numbers.
    

## Hardware-aware sparsity in heterogeneous web architectures

Efficient scaling is contingent upon the integration of the UFTA into heterogeneous CPU-GPU architectures, specifically targeting web-based execution environments via WebGPU.

- **Heterogeneous compute utilisation:** the architecture partitions the simulation workload between host CPU logic and GPU acceleration kernels. The CPU manages high-level topological data analysis (TDA) and tree navigation, while WebGPU kernels execute high-throughput sparse field transport.
    
- **Sparse data encoding on the GPU:** to implement the "zero morphism" principle within standard GPU memory constraints, the UFTA utilises indirection buffers and bitmask-based occupancy grids. This ensures that inactive spatial regions do not undergo fragment processing or consume significant VRAM bandwidth.
    
- **Asynchronous compute dispatch:** the framework leverages the non-blocking nature of WebGPU command buffers to manage entropy-driven temporal integration. This allows for asynchronous sub-stepping of chaotic manifold regions, where high-frequency sampling occurs independently of the global rendering loop.
    

## Sparse and non-Euclidean data structures

The transition from dense hypercubic lattices to sparse indices facilitates the allocation of memory resources strictly to regions of active phase-field magnitude $A$.

### Spatial hashing and Prime XOR indexing

The UFTA replaces pointer-based hierarchical structures, such as octrees or Bounding Volume Hierarchies (BVHs), with spatial hashing utilising Prime XOR operations.

- **Hash function:** 3D coordinates $(x, y, z)$ are mapped to a 1D buffer index via $Index = (x \cdot P_1) \oplus (y \cdot P_2) \oplus (z \cdot P_3) \pmod{\text{BufferSize}}$, where $P_n$ are distinct large primes.
    
- **Computational throughput:** this provides $O(1)$ random access to active voxels, eliminating $O(\log N)$ traversal latency and reducing VRAM overhead for internal nodes.
    

### Bruhat–Tits trees and p-adic topology

Hierarchical data structures embedded in Euclidean containers suffer from a "geometric crisis" where the number of nodes grows exponentially while the container volume grows only polynomially ($r^3$).

- **Hyperbolic volume growth:** in a hyperbolic manifold, volume grows exponentially with radius, permitting the embedding of deep hierarchies with minimal distortion.
    
- **Bruhat–Tits skeletons:** a $(p+1)$-regular tree serves as the discrete scaffolding for a p-adic manifold. This non-Archimedean structure naturally represents hierarchical coordination, where memory scales with the depth of the tree rather than the volume of the 3D bulk.
    

## Number-theoretic procedural generation

To eliminate the requirement for static volumetric storage, the framework adopts an "Arithmetica Lucis" paradigm, deriving geometry from algebraic invariants.

- **Farey–Ford resonance sampling:** instead of storing voxel data, the system generates micro-structural detail on-the-fly via the order of a Farey sequence. This allows for "infinite resolution" graphics and physics, as the NDF (normal distribution function) is a deterministic property of the number-theoretic engine.
    
- **Arithmetic engines as scene files:** the manifold state is defined by a compact set of algebraic parameters (e.g., modular group transformations), effectively reducing the 4 GB requirement of a $256^3$ grid to a kilobyte-scale symbolic string.
    

## Holographic and algebraic compression

Volumetric complexity is reduced to boundary or symbolic signatures through the application of the holographic principle and group-theoretic metric distortion.

### Holographic bulk-to-boundary mapping

The Sierpinski–AdS correspondence utilises AdS/CFT duality to map 3D bulk complexity to a 2D fractal boundary circuit.

- **Dimensionality reduction:** the primary compute task is restricted to the boundary theory. The 3D state is reconstructed as an emergent projection of the boundary data via the Selberg Trace Formula.
    
- **Information scaling:** information density is bound by the Bekenstein limit, which scales with surface area.
    

### Non-Hopfian metric compression

Baumslag–Solitar groups, specifically $BS(1,2)$, are utilised for exponential metric compression.

- **Algebraic kernel distortion:** subgroup distortion properties allow for the encoding of massive spatial distances within short algebraic words.
    
- **Topological hashing:** features are tracked across training runs via topological hashes based on homology, ensuring scientific reproducibility without the storage of raw volumetric snapshots.
    

## Spectral topological filtration

Topological data analysis (TDA) is utilised as a gating mechanism for memory management.

- **Persistence barcodes:** transient numerical noise is distinguished from persistent structural novelty through spectral analysis of the phase field.
    
- **Asynchronous culling:** TDA barcodes are transferred to the CPU via high-speed buffers, enabling the system to prune "uninteresting" regions of the manifold from VRAM before they contribute to the $O(N^3)$ accumulation.
    

## Conclusion

The uncoupling of resolution from memory capacity is achieved through a multi-modal strategy: spatial hashing for local access, Bruhat–Tits trees for hierarchical coordination, Farey–Ford proceduralism for infinite-resolution generation, and holographic mapping for bulk reconstruction. These strategies, when deployed on heterogeneous web-based architectures using WebGPU, enable the CPS-HCA to scale toward $512^3$ resolutions and beyond within current hardware limitations.