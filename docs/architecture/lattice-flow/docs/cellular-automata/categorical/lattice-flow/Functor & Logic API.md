# Lattice Flow: Functor & Logic API

In Lattice Flow, physical laws are implemented as **Functors**. This guide explains how to define local update rules that maintain categorical consistency.

## 1. Defining a Morphism

A morphism is a function that maps a stalk state from time $t$ to $t+1$. To be valid, it must commute with the Sheaf Laplacian.

### Basic Template (WGSL)

```
fn apply_functor(current_state: vec4<f32>, neighbors: array<vec4<f32>, 8>) -> vec4<f32> {
    // 1. Calculate Local Agreement
    let energy = calculate_sheaf_energy(current_state, neighbors);
    
    // 2. Apply Error Correction (Gravity)
    let correction = gradient_descent(energy);
    
    // 3. Return New State
    return current_state + correction;
}
```

## 2. Predefined Functor Categories

### A. The Harmonic Propagator

- **Goal:** Reach a Global Section.
    
- **Morphism:** Simple diffusion across the restriction maps.
    
- **Emergent Physics:** Heat dissipation, fluid leveling.
    

### B. The Unitary Wave Functor

- **Goal:** Preserve Stalk Norm (Energy Conservation).
    
- **Morphism:** Rotation of the complex phase in the stalk.
    
- **Emergent Physics:** Interference patterns, caustics, quantum-like behavior.
    

### C. The $p$-adic Automaton

- **Goal:** Number-theoretic evolution.
    
- **Morphism:** Bit-shifting the $p$-adic coefficients based on neighbor parity.
    
- **Emergent Physics:** Fractal growth, self-similar "Talbot Carpets."
    

## 3. The Update Loop

The engine executes these functors in two passes:

1. **Logic Pass:** Updates the `stalk_data` in the `NodeState` buffer.
    
2. **Spectral Pass:** Updates the `pos` (coordinates) based on the new Laplacian state, causing the topology to "morph" in real-time.