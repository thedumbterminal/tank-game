import { describe, it, expect } from 'vitest';
import { Terrain } from './Terrain';
import { DEFAULT_CONFIG } from './types';

const config = DEFAULT_CONFIG;

describe('Terrain Generation', () => {
  it('generates terrain with hills and variation', () => {
    const terrain = new Terrain(config);
    const heights = new Set<number>();
    for (let x = 0; x < config.canvasWidth; x += 50) {
      heights.add(Math.round(terrain.getHeightAt(x)));
    }
    // Should have variation (not a flat line)
    expect(heights.size).toBeGreaterThan(1);
  });

  it('terrain is randomly generated (different each time)', () => {
    const terrain1 = new Terrain(config);
    const terrain2 = new Terrain(config);
    let different = false;
    for (let x = 0; x < config.canvasWidth; x += 10) {
      if (terrain1.getHeightAt(x) !== terrain2.getHeightAt(x)) {
        different = true;
        break;
      }
    }
    expect(different).toBe(true);
  });

  it('terrain height stays within canvas bounds', () => {
    const terrain = new Terrain(config);
    for (let x = 0; x < config.canvasWidth; x++) {
      const h = terrain.getHeightAt(x);
      expect(h).toBeGreaterThanOrEqual(config.canvasHeight * 0.4);
      expect(h).toBeLessThanOrEqual(config.canvasHeight * 0.9);
    }
  });

  it('getHeightAt clamps to valid range for out-of-bounds x', () => {
    const terrain = new Terrain(config);
    expect(() => terrain.getHeightAt(-10)).not.toThrow();
    expect(() => terrain.getHeightAt(config.canvasWidth + 100)).not.toThrow();
  });
});

describe('Terrain Craters', () => {
  it('creates a crater that lowers terrain (increases height value)', () => {
    const terrain = new Terrain(config);
    const centerX = config.canvasWidth / 2;
    const beforeHeight = terrain.getHeightAt(centerX);
    terrain.createCrater(centerX, 15, 12);
    const afterHeight = terrain.getHeightAt(centerX);
    // In canvas coords, higher y = lower on screen, so crater makes height increase
    expect(afterHeight).toBeGreaterThan(beforeHeight);
  });

  it('crater has parabolic shape (deeper at center)', () => {
    const terrain = new Terrain(config);
    const centerX = config.canvasWidth / 2;
    const radius = 20;
    const beforeCenter = terrain.getHeightAt(centerX);
    const beforeEdge = terrain.getHeightAt(centerX + radius - 1);
    terrain.createCrater(centerX, radius, 15);
    const afterCenter = terrain.getHeightAt(centerX);
    const afterEdge = terrain.getHeightAt(centerX + radius - 1);
    const centerDelta = afterCenter - beforeCenter;
    const edgeDelta = afterEdge - beforeEdge;
    expect(centerDelta).toBeGreaterThan(edgeDelta);
  });

  it('larger crater radius affects more terrain', () => {
    const terrain = new Terrain(config);
    const centerX = config.canvasWidth / 2;
    const farPoint = centerX + 25;
    const before = terrain.getHeightAt(farPoint);
    terrain.createCrater(centerX, 30, 12);
    const after = terrain.getHeightAt(farPoint);
    // A radius-30 crater should affect x+25
    expect(after).toBeGreaterThan(before);
  });

  it('crater height is clamped to canvas bounds', () => {
    const terrain = new Terrain(config);
    const centerX = config.canvasWidth / 2;
    // Create many craters to push terrain deep
    for (let i = 0; i < 50; i++) {
      terrain.createCrater(centerX, 15, 20);
    }
    expect(terrain.getHeightAt(centerX)).toBeLessThanOrEqual(config.canvasHeight - 5);
  });
});
