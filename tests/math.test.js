import { describe, it, expect } from 'vitest';
import { normalize2D, dot2D, clamp } from '../src/math_utils.js';

describe('Math Utilities', () => {
  it('should normalize a 2D vector', () => {
    const [nx, ny] = normalize2D(3, 4); // 3-4-5 triangle
    expect(nx).toBeCloseTo(0.6);
    expect(ny).toBeCloseTo(0.8);
  });

  it('should handle zero-length vectors in normalisation', () => {
    const [nx, ny] = normalize2D(0, 0);
    expect(nx).toBe(0);
    expect(ny).toBe(0);
  });

  it('should calculate dot product', () => {
    expect(dot2D(1, 0, 0, 1)).toBe(0); // Perpendicular
    expect(dot2D(1, 2, 3, 4)).toBe(11); // 1*3 + 2*4 = 3 + 8 = 11
  });

  it('should clamp values', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});
