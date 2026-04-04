# Lattice Flow: Buffer & Memory Specification

This document defines the raw memory layout for the WebGPU `StorageBuffers` used in the Spectral Sheaf Automata. To maintain high performance on non-Euclidean substrates, we utilize a 1D linear memory layout with structured alignment.

## 1. NodeState Buffer (Stalks)

Each node in the simulation represents a vertex in the simplicial complex. The `NodeState` stores the current "Stalk" values and their spectral coordinates.

|   |   |   |   |
|---|---|---|---|
|**Attribute**|**Type**|**Size**|**Description**|
|`stalk_data`|`vec4<f32>`|16 bytes|The internal logical state (e.g., Complex phases or $p$-adic coefficients).|
|`pos`|`vec3<f32>`|12 bytes|Spectral Coordinates $(\psi_1, \psi_2, \psi_3)$ derived from eigenvectors.|
|`energy`|`f32`|4 bytes|Scalar local Sheaf Energy (Frustration).|
|`velocity`|`vec3<f32>`|12 bytes|Momentum of the node in spectral space.|
|`_padding`|`f32`|4 bytes|Alignment padding.|

**Total Size:** 48 bytes per node.

## 2. Edge Buffer (Restriction Maps)

Edges connect nodes and store the morphisms (Restriction Maps) that dictate how information translates across the lattice.

|   |   |   |   |
|---|---|---|---|
|**Attribute**|**Type**|**Size**|**Description**|
|`source_id`|`u32`|4 bytes|Index of the source node.|
|`target_id`|`u32`|4 bytes|Index of the target node.|
|`morphism`|`mat2x2<f32>`|16 bytes|The restriction map (Möbius coefficients $a, b, c, d$).|
|`weight`|`f32`|4 bytes|Edge weight (used for normalized Laplacian).|

**Note:** For **Infinite-order tilings**, this buffer is partially bypassed in favor of **Procedural Adjacency Functions** in the shader to avoid $O(\infty)$ memory requirements.

## 3. Simplex Buffer (Higher-Order Frustration)

Used for 2-simplices (triangles) to track non-abelian consistency.

|   |   |   |   |
|---|---|---|---|
|**Attribute**|**Type**|**Size**|**Description**|
|`face_ids`|`vec3<u32>`|12 bytes|Indices of the three edges forming the triangle.|
|`holonomy`|`f32`|4 bytes|The product of maps around the loop (Identity = 1.0).|

## 4. Alignment Requirements (WGSL)

All buffers must be 16-byte aligned to ensure compatibility with WebGPU `std140` or `std430` layouts.