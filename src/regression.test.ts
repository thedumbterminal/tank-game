import { describe, it, expect } from 'vitest';
import { Tank } from './Tank';
import { DEFAULT_CONFIG, PlayerSide, TankTypeName } from './types';

/**
 * Regression Tests
 *
 * This file contains regression tests for bugs that have been found and fixed.
 * Each test should reference the bug it prevents from recurring.
 *
 * Convention:
 *   describe('Bug: <short description>', () => {
 *     it('should <expected correct behavior>', () => { ... });
 *   });
 */

const config = DEFAULT_CONFIG;

describe('Bug: MAUS could fire every turn instead of every 2 turns', () => {
  it('should not allow MAUS to fire on the turn immediately after firing', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    tank.onFired();
    tank.onTurnStart();
    expect(tank.canFire).toBe(false);
  });

  it('should allow MAUS to fire again only after a full cooldown of 2 turns', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    tank.onFired();
    tank.onTurnStart(); // turn 1 - cooldown
    tank.onTurnStart(); // turn 2 - ready
    expect(tank.canFire).toBe(true);
  });

  it('should still allow ABRAMS to fire every turn (cooldown of 1)', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Abrams);
    tank.onFired();
    tank.onTurnStart();
    expect(tank.canFire).toBe(true);
  });
});
