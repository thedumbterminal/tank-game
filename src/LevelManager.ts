import { LevelConfig } from './types';

/**
 * Computes bot difficulty configuration for a given level.
 * Difficulty increases each level: jitter decreases, decisions get faster,
 * fire thresholds tighten, and bot health scales up.
 *
 * Formula:
 *   botJitter            = max(0.01,  0.08  - level * 0.007)
 *   botActionInterval    = max(0.15,  0.5   - level * 0.03)
 *   botAngleThreshold    = max(0.04,  0.15  - level * 0.01)
 *   botPowerThreshold    = max(8,     40    - level * 3)
 *   botHealthMultiplier  = min(3.0,   1.0   + level * 0.1)
 */
export function getLevelConfig(level: number): LevelConfig {
  return {
    level,
    botJitter:           Math.max(0.01, 0.08  - level * 0.007),
    botActionInterval:   Math.max(0.15, 0.5   - level * 0.03),
    botAngleThreshold:   Math.max(0.04, 0.15  - level * 0.01),
    botPowerThreshold:   Math.max(8,    40    - level * 3),
    botHealthMultiplier: Math.min(3.0,  1.0   + level * 0.1),
  };
}

export class LevelManager {
  private _currentLevel: number = 1;

  get currentLevel(): number {
    return this._currentLevel;
  }

  getLevelConfig(level: number): LevelConfig {
    return getLevelConfig(level);
  }

  advance(): void {
    this._currentLevel++;
  }

  reset(): void {
    this._currentLevel = 1;
  }

  setLevel(level: number): void {
    this._currentLevel = Math.max(1, level);
  }
}
