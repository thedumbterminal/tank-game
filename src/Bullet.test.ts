import { describe, it, expect } from 'vitest';
import { Bullet } from './Bullet';
import { DEFAULT_CONFIG } from './types';

const config = DEFAULT_CONFIG;

describe('Bullet Physics', () => {
  it('applies gravity to vertical velocity', () => {
    const bullet = new Bullet({ x: 100, y: 100 }, { x: 100, y: 0 }, 0, config);
    bullet.update(0.1);
    expect(bullet.velocity.y).toBeCloseTo(config.gravity * 0.1);
  });

  it('updates position based on velocity', () => {
    const bullet = new Bullet({ x: 100, y: 100 }, { x: 200, y: -100 }, 0, config);
    bullet.update(0.1);
    expect(bullet.position.x).toBeGreaterThan(100);
    expect(bullet.position.y).toBeLessThan(100);
  });

  it('deactivates when going out of bounds left', () => {
    const bullet = new Bullet({ x: -51, y: 100 }, { x: -100, y: 0 }, 0, config);
    bullet.update(0.01);
    expect(bullet.active).toBe(false);
  });

  it('deactivates when going out of bounds right', () => {
    const bullet = new Bullet(
      { x: config.canvasWidth + 51, y: 100 },
      { x: 100, y: 0 },
      0,
      config
    );
    bullet.update(0.01);
    expect(bullet.active).toBe(false);
  });

  it('does not update position when inactive', () => {
    const bullet = new Bullet({ x: 100, y: 100 }, { x: 200, y: 0 }, 0, config);
    bullet.active = false;
    bullet.update(0.1);
    expect(bullet.position.x).toBe(100);
  });

  it('tracks owner index correctly', () => {
    const bullet = new Bullet({ x: 0, y: 0 }, { x: 0, y: 0 }, 1, config);
    expect(bullet.owner).toBe(1);
  });

  it('stores crater radius', () => {
    const bullet = new Bullet({ x: 0, y: 0 }, { x: 0, y: 0 }, 0, config, 30);
    expect(bullet.craterRadius).toBe(30);
  });

  it('defaults crater radius to 15', () => {
    const bullet = new Bullet({ x: 0, y: 0 }, { x: 0, y: 0 }, 0, config);
    expect(bullet.craterRadius).toBe(15);
  });
});

describe('Bullet Terrain Collision', () => {
  it('marks hitTerrain when bullet hits ground', () => {
    const bullet = new Bullet({ x: 100, y: config.groundLevel + 1 }, { x: 0, y: 10 }, 0, config);
    bullet.update(0.01);
    expect(bullet.active).toBe(false);
    expect(bullet.hitTerrain).toBe(true);
  });

  it('uses terrain height function when provided', () => {
    const lowTerrain = () => 200;
    const bullet = new Bullet({ x: 100, y: 199 }, { x: 0, y: 10 }, 0, config);
    bullet.update(0.1, lowTerrain);
    expect(bullet.active).toBe(false);
    expect(bullet.hitTerrain).toBe(true);
  });

  it('stays active above terrain', () => {
    const highTerrain = () => 500;
    const bullet = new Bullet({ x: 100, y: 100 }, { x: 10, y: 0 }, 0, config);
    bullet.update(0.01, highTerrain);
    expect(bullet.active).toBe(true);
    expect(bullet.hitTerrain).toBe(false);
  });
});

describe('Bullet Trajectory', () => {
  it('returns trajectory points', () => {
    const bullet = new Bullet({ x: 100, y: 100 }, { x: 200, y: -100 }, 0, config);
    const points = bullet.getTrajectoryPoints(10);
    expect(points.length).toBeGreaterThan(0);
    expect(points.length).toBeLessThanOrEqual(10);
  });

  it('first trajectory point matches bullet position', () => {
    const bullet = new Bullet({ x: 100, y: 100 }, { x: 200, y: -100 }, 0, config);
    const points = bullet.getTrajectoryPoints(10);
    expect(points[0].x).toBe(100);
    expect(points[0].y).toBe(100);
  });
});
