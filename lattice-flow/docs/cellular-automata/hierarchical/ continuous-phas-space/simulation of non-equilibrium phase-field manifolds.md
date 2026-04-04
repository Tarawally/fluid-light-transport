# Research notes: continuous phase space and hierarchical cellular automata

**Date**: 1 April 2026

**Subject**: Architectural summary and verification status of the **continuous phase space – hierarchical cellular automata** manifold

## Executive summary

The **continuous phase space – hierarchical cellular automata** (CPS-HCA) is a unified framework for the real-time simulation and verification of non-equilibrium phase-field manifolds. By transitioning from extrinsic mesh-based geometry to an intrinsic, field-centric paradigm, the technology is utilised for the analysis of active matter, synthetic morphogenesis, and the mathematical regulation of artificial intelligence (AI).

## Architectural principles

The architecture reconciles discrete spatial queries with continuous field transport through several established mechanisms:

- **Intrinsic representation**: geometry emerges from a complex-valued phase field $\psi = A e^{i\phi}$. The magnitude $A$ represents local density, while the phase $\phi$ determines momentum and structural coherence. Interfaces are identified through phase-discontinuities and structural entropy gradients, permitting sub-voxel surface resolution at the phase-space transition.
    
- **Spatial discretisation and occupancy**: the system utilises nested multi-scale grids to accelerate spatial queries by amortising computational costs. Local interactions are resolved at the highest resolution, while long-range coordination is processed via down-sampled macro-blocks. Memory occupancy is significant; a grid of $128^3$ voxels requires approximately 512 MB of VRAM, while a $256^3$ grid requires four GB. WebGPU kernels utilise tiled shading alongside experimental subgroup and cooperative matrix extensions to manage bandwidth.
    
- **Entropy-driven adaptive sub-stepping**: the system employs a local temporal integration frequency determined by structural entropy. In regions of high chaotic transition, the manifold triggers higher-frequency sampling to prevent topological discontinuities or numerical instability.
    
- **Differentiable manifolds and gradient-based control**: the natively differentiable architecture enables neural network backpropagation. This coupling allows AI latent spaces to influence manifold evolution via gradients applied directly to $\psi$. Researchers interact with this process through a differentiable interface, utilising specific parameters – such as the localised fixing of vortex filaments – to manually constrain topological development.
    

## Numerical noise and power spectral density

The framework distinguishes between numerical precision errors and physical thermal fluctuations through spectral analysis:

- **Stochastic noise floor**: the system monitors the power spectral density (PSD) of the phase field to identify high-frequency artifacts. Noise resulting from destructive interference is interpreted as physical decoherence, whereas periodic artifacts are identified as numerical sampling errors.
    
- **Thermal fluctuation modelling**: the manifold incorporates a stochastic term to simulate thermal fluctuations at sub-voxel scales, ensuring the simulation maintains non-equilibrium stability without collapsing into a trivial steady state.
    

## Radiance cascades and intrinsic occlusion

Radiance transport is treated as a continuous field through unified transport logic:

- **Radiance cascades (RC)**: the light transport equation (LTE) is solved via hierarchical spatial and angular partitioning, treating radiance as a discrete quantum light field (QLF). This structure adheres to a topological uncertainty principle: near-field probes maintain high spatial resolution with coarse angular sampling, while far-field transport prioritises angular precision over spatial locality.
    
- **Intrinsic occlusion**: visibility is an emergent property of manifold entropy. High-entropy boundaries function as topological insulators, reducing scattering kernels to prevent transmission through thin biological membranes without requiring shadow maps or explicit ray-geometry intersection tests.
    
- **Eikonal wave transport**: eikonal methods reconstruct three-dimensional (3D) depth and diffraction fringes. By treating the radiance field as a complex-valued amplitude, the system resolves focus cues and interference patterns consistent with the phase-locking of the underlying automata.
    

## Boundary conditions and symmetry-breaking

The system monitors and regulates non-equilibrium transitions where the manifold undergoes spontaneous symmetry breaking:

- **Mathematical boundary conditions**: the phase field $\psi$ supports the implementation of Dirichlet, Neumann, and Periodic boundary conditions. These are utilised to constrain the manifold within specific experimental geometries or to simulate infinite periodic lattices.
    
- **Topological defect classification**: the logic identifies Berezinskii–Kosterlitz–Thouless (BKT) transition points by monitoring the pairing of vortex–antivortex defects. The system classifies these as point defects (hedgehogs) or line defects (strings) and monitors their associated topological charges.
    
- **Energy conservation and dissipation rates**: solitary waves are maintained through a balance of non-linear reinforcement and dissipative phase-locking. The system applies energy-consistent damping to prevent numerical divergence, utilising specific dissipation constants to ensure solitons maintain topological integrity.
    

## Mathematical verification of artificial intelligence

The system regulates physics-informed neural networks (PINNs) and large language models (LLMs) through topological constraints:

- **Topological boundary regulation**: the AI latent space is constrained by physical laws acting as boundary conditions. Proposed states violating these constraints – such as those exceeding the local Courant–Friedrichs–Lewy (CFL) limit – are reflected or dissipated through dissipative kernels.
    
- **Topological grammar for LLMs**: to facilitate token-to-field mapping, the system employs a formal topological grammar. Discrete tokens are assigned specific topological weights that determine their influence on the phase field. This ensures that generated sequences result in trajectories that are mathematically continuous and physically realisable within the manifold.
    
- **Verification via invariants and collective locking**: the system enforces topological invariants over scalar error metrics. It monitors multi-agent phase-locking protocols to ensure swarms or multicellular systems synchronise local phases into a coherent global structure:
    
    - Winding numbers ($b_1$): these track the stability of vortex filaments and solitons.
        
    - Topological charge: this ensures AI respects quantised feature identities.
        
- **Culling and discovery**: topological data analysis (TDA) distinguishes transient noise from persistent structural novelty. TDA barcodes are transferred to the CPU via high-speed asynchronous buffers to gate AI generations in real time.
    

## Higher-order homology and four-dimensional verification

Verification capabilities are expanding into higher dimensions, despite significant computational overhead:

- **Second Betti number (**$b_2$**)**: enforcing $b_2$ as a hard constraint is required for biological simulations involving compartmentalisation. This prevents the culling of valid biological voids that might otherwise be classified as numerical noise.
    
- **Four-dimensional spacetime manifolds (**$b_3$**)**: treating simulations as (3+1) manifolds allows $b_3$ checks to verify temporal consistency. Current implementations are limited to low-entropy regions or sparse grids due to the exponential cost of higher-order homology calculations.
    

## Model divergence and epistemological limitations

The primary bottleneck for the framework is the divergence between experimental data and mathematical models:

- **Parameter-model divergence**: noisy experimental data may contradict the manifold model, causing the system to reject valid novelties as unphysical.
    
- **Predictive bias**: a potential bias exists where the system may suppress valid discoveries that violate current physical models. Stricter entropy-bounds may inadvertently filter out radical phase transitions that represent new, unmodelled phenomena.
    
- **Federated latent space synchronisation**: to mitigate data scarcity, multiple entities across different laboratories contribute to a shared, federated latent manifold. Collaborative synchronisation allows the system to characterise rare phase transitions statistically absent in single-user datasets.
    

## Data provenance and Laboratory Operating System protocols

To ensure scientific reproducibility, the system maintains a rigorous record of manifold evolution:

- **Topological hashing**: every persistent feature in the manifold is assigned a unique topological hash based on its homology and winding number. This allows researchers to track the lineage of a discovered soliton or multicellular structure across different training runs.
    
- **Laboratory Operating System (Lab-OS) integration**: the manifold evolution and associated topological hashes are indexed within Lab-OS protocols, enabling automated cross-referencing with experimental metadata.
    
- **Latent state journaling**: the system records the gradients applied by AI agents to the phase field $\psi$. This audit trail is essential for identifying whether a specific discovery was driven by physical necessity or by an idiosyncrasy in the AI curriculum.
    

## Conclusion

The CPS-HCA is a mature tool demonstrating that complex living systems are best verified as continuous, phase-locked manifolds governed by topological rules.