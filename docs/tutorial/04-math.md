---
title: "The Maths of Space"
---

# The Maths of Space

To simulate light, we must describe location and movement using **Vectors**.

## Vectors: Arrows in Space

A **Vector** is simply an arrow with:
1.  **Origin**: Where it starts.
2.  **Direction**: Which way it points.
3.  **Magnitude**: How long it is.

In our 2D grid, a vector is often just two numbers: $(x, y)$.

*   $(1, 0)$ points Right.
*   $(0, 1)$ points Down.
*   $(-1, 0)$ points Left.

<div class="tip">

### API Reference
See the complete vector implementation in [API Reference](../reference/api).

</div>

### Normalisation

Sometimes we care only about direction, not length. If we shrink a vector so its length is exactly $1.0$, we call it a **Unit Vector** or say it is **Normalised**.

<div class="aside">
Normalising a vector is like noting the direction a finger points, whilst ignoring the finger's length.
</div>

```js
const vectorX = view(Inputs.range([-1, 1], {value: 1, step: 0.1, label: "X"}));
const vectorY = view(Inputs.range([-1, 1], {value: 0.5, step: 0.1, label: "Y"}));
```

```js
const length = Math.sqrt(vectorX * vectorX + vectorY * vectorY);
const normalizedX = length > 0 ? vectorX / length : 0;
const normalizedY = length > 0 ? vectorY / length : 0;

display(Plot.plot({
  grid: true,
  x: {domain: [-2, 2]},
  y: {domain: [-2, 2]},
  marks: [
    Plot.frame(),
    Plot.arrow([{x1: 0, y1: 0, x2: vectorX, y2: vectorY}], {x1: "x1", y1: "y1", x2: "x2", y2: "y2", stroke: "red", strokeWidth: 3}),
    Plot.arrow([{x1: 0, y1: 0, x2: normalizedX, y2: normalizedY}], {x1: "x1", y1: "y1", x2: "x2", y2: "y2", stroke: "blue", strokeWidth: 2, strokeDasharray: "4,4"}),
    Plot.text([{x: vectorX, y: vectorY, label: `Original (${vectorX.toFixed(2)}, ${vectorY.toFixed(2)})`}], {x: "x", y: "y", text: "label", dy: -10, fill: "red"}),
    Plot.text([{x: normalizedX, y: normalizedY, label: `Normalised (${normalizedX.toFixed(2)}, ${normalizedY.toFixed(2)})`}], {x: "x", y: "y", text: "label", dy: 15, fill: "blue"})
  ]
}));
```

```js
display(md`
**Red arrow**: Original vector with length = ${length.toFixed(3)}  
**Blue arrow** (dashed): Normalised version with length = 1.0
`);
```

## Distance (Pythagoras)

To determine the distance of a light source, we use the Pythagorean Theorem:

${tex`a^2 + b^2 = c^2`}

Or in code:

```javascript
const dist = Math.sqrt(x*x + y*y);
```

We use this in `Scene.shade` to calculate light fall-off over distance (Inverse Square Law).

## Vector Operations in Practice

Our engine uses vectors extensively for:

- **Position**: Where objects are in 2D space
- **Velocity**: How fast and in which direction light flows
- **Direction**: Ray casting and collision detection

```mermaid
graph LR
    A[Light Source<br/>Position: 5,3] -->|Cast Ray<br/>Direction: 1,0| B[Pixel Grid]
    B -->|Hit Detection<br/>Distance: √((x₂-x₁)²+(y₂-y₁)²)| C[Sphere]
    C -->|Reflect<br/>New Direction| D[Secondary Ray]
```

<div class="note">

### Implementation Details
- **Vector addition**: Combines positions or velocities ([API Reference](../reference/api))
- **Dot product**: Measures alignment between directions
- **Normalisation**: Used in ray direction calculations

</div>

[→ Next: Ray Tracing](05-raytracing) | [← Previous: Memory](03-memory)
