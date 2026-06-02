---
title: "The Language of Logic"
---

# The Language of Logic

To control pixels, we must speak the computer's language. Here, that language is **JavaScript**.

## Variables: The Boxes of Memory

Imagine a warehouse of empty boxes. We can label a box and store items inside. In programming, we call this a **Variable**.

*   [`const`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const): A box whose contents **cannot** be changed (Constant).
*   [`let`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let): A box whose contents **can** be changed.

```javascript
"use strict"; /* Enforce stricter parsing and error handling */

/* Configuration constants for the simulation. */
const CONFIG = {
  TILE_SIZE: 4,      // We process pixels in 4x4 blocks
  DISSIPATION: 0.97, // Energy lost per tick
};

let TOTAL_PIXELS = 0; // This updates when the window resizes
```

## Functions: The Recipes

A [`function`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function) is a bundle of instructions. Like a recipe, you give it a name and "call" it to execute those instructions.

Our engine uses `bootSystem` to initialise the environment.

```javascript
/**
 * Allocates memory and sets grid dimensions based on the current window size.
 */
function bootSystem() {
  // 1. Calculate internal resolution
  RESOLUTION.W = Math.ceil(window.innerWidth / CONFIG.DOWNSAMPLE);
  RESOLUTION.H = Math.ceil(window.innerHeight / CONFIG.DOWNSAMPLE);
  
  // 2. Initialise buffers
  GRID = new Float32Array(RESOLUTION.W * RESOLUTION.H * TILE_TYPES);
  
  // 3. Inform the UI
  UI.updateResolutionDisplay(RESOLUTION.W, RESOLUTION.H);
}
```

In the logic above:
1. We calculate grid dimensions by dividing the window size by a downsampling factor.
2. We allocate a flat array in memory to hold the pixel data.
3. We update the on-screen display with the new coordinates.

## Loops: Repetition

Computers excel at repetition. We use a **Loop** to repeat instructions for thousands of pixels at once.

The common `for` loop states: "Start here, continue whilst this is true, and perform this action after each step."

```javascript
/**
 * Zeroes out the entire light transport grid.
 */
function ClearGrid() {
  for (let i = 0; i < GRID.length; i++) {
    GRID[i] = 0.0;
  }
}
```

In this loop:
1. We iterate from index `0` up to the total length of the array (`GRID.length`).
2. We set every single value to zero, effectively "turning off the lights."

```javascript
for (let x = 0; x < width; x++) {
    // Process pixel at 'x'
}
```

## Conditionals: Making Decisions

We often adapt behaviour based on the situation using `if` statements.

```javascript
if (energy < 0.001) {
    // If energy is negligible, stop processing to conserve battery
    continue;
}
```
