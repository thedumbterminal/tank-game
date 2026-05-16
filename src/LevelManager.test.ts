import { describe, it, expect } from 'vitest';
import { LevelManager, getLevelConfig } from './LevelManager';

describe('getLevelConfig formula', () => {
  it('returns correct values at level 1', () => {
    const cfg = getLevelConfig(1);
    expect(cfg.level).toBe(1);
    expect(cfg.botJitter).toBeCloseTo(0.073, 3);
    expect(cfg.botActionInterval).toBeCloseTo(0.47, 3);
    expect(cfg.botAngleThreshold).toBeCloseTo(0.14, 3);
    expect(cfg.botPowerThreshold).toBeCloseTo(37, 0);
    expect(cfg.botHealthMultiplier).toBeCloseTo(1.1, 3);
  });

  it('returns correct values at level 5', () => {
    const cfg = getLevelConfig(5);
    expect(cfg.botJitter).toBeCloseTo(0.045, 3);
    expect(cfg.botActionInterval).toBeCloseTo(0.35, 3);
    expect(cfg.botAngleThreshold).toBeCloseTo(0.10, 3);
    expect(cfg.botPowerThreshold).toBeCloseTo(25, 0);
    expect(cfg.botHealthMultiplier).toBeCloseTo(1.5, 3);
  });

  it('returns correct values at level 10', () => {
    const cfg = getLevelConfig(10);
    expect(cfg.botJitter).toBeCloseTo(0.01, 3);
    expect(cfg.botActionInterval).toBeCloseTo(0.20, 3);
    expect(cfg.botAngleThreshold).toBeCloseTo(0.05, 3);
    expect(cfg.botPowerThreshold).toBeCloseTo(10, 0);
    expect(cfg.botHealthMultiplier).toBeCloseTo(2.0, 3);
  });

  it('caps botJitter at 0.01 at high levels', () => {
    const cfg = getLevelConfig(50);
    expect(cfg.botJitter).toBe(0.01);
  });

  it('caps botActionInterval at 0.15 at high levels', () => {
    const cfg = getLevelConfig(50);
    expect(cfg.botActionInterval).toBe(0.15);
  });

  it('caps botAngleThreshold at 0.04 at high levels', () => {
    const cfg = getLevelConfig(50);
    expect(cfg.botAngleThreshold).toBe(0.04);
  });

  it('caps botPowerThreshold at 8 at high levels', () => {
    const cfg = getLevelConfig(50);
    expect(cfg.botPowerThreshold).toBe(8);
  });

  it('caps botHealthMultiplier at 3.0 at level 20+', () => {
    const cfg = getLevelConfig(20);
    expect(cfg.botHealthMultiplier).toBe(3.0);
  });

  it('caps botHealthMultiplier at 3.0 at very high levels', () => {
    const cfg = getLevelConfig(100);
    expect(cfg.botHealthMultiplier).toBe(3.0);
  });
});

describe('LevelManager', () => {
  it('starts at level 1', () => {
    const lm = new LevelManager();
    expect(lm.currentLevel).toBe(1);
  });

  it('advance() increments the level', () => {
    const lm = new LevelManager();
    lm.advance();
    expect(lm.currentLevel).toBe(2);
  });

  it('advance() can be called multiple times', () => {
    const lm = new LevelManager();
    lm.advance();
    lm.advance();
    lm.advance();
    expect(lm.currentLevel).toBe(4);
  });

  it('reset() returns level to 1', () => {
    const lm = new LevelManager();
    lm.advance();
    lm.advance();
    lm.reset();
    expect(lm.currentLevel).toBe(1);
  });

  it('setLevel() sets a specific level', () => {
    const lm = new LevelManager();
    lm.setLevel(7);
    expect(lm.currentLevel).toBe(7);
  });

  it('setLevel() clamps to minimum of 1', () => {
    const lm = new LevelManager();
    lm.setLevel(0);
    expect(lm.currentLevel).toBe(1);
  });

  it('getLevelConfig() returns config for current level', () => {
    const lm = new LevelManager();
    lm.setLevel(5);
    const cfg = lm.getLevelConfig(5);
    expect(cfg.level).toBe(5);
    expect(cfg.botHealthMultiplier).toBeCloseTo(1.5, 3);
  });
});
