/**
 * @fileoverview Primitive math utilities for the Fluid Light Transport engine.
 */

/**
 * Returns a normalised 2D vector (new array).
 * @param {number} x 
 * @param {number} y 
 * @returns {number[]} The normalised vector [x, y]
 */
export function normalize2D(x, y) {
  const len = Math.sqrt(x * x + y * y);
  if (len === 0) return [0, 0];
  return [x / len, y / len];
}

/**
 * Calculates the dot product of two 2D vectors.
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @returns {number} The dot product.
 */
export function dot2D(x1, y1, x2, y2) {
  return x1 * x2 + y1 * y2;
}

/**
 * Returns a value clamped between min and max.
 * @param {number} val Input value.
 * @param {number} min Lower bound.
 * @param {number} max Upper bound.
 * @returns {number} The clamped value.
 */
export function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}
