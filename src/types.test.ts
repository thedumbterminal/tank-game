import { describe, it, expect } from 'vitest';
import {
  DEFAULT_CONFIG,
  TANK_TYPES,
  TankTypeName,
  GameState,
  PlayerSide,
} from './types';

describe('Game Configuration', () => {
  it('is a 2D side-on fixed screen (has canvas dimensions)', () => {
    expect(DEFAULT_CONFIG.canvasWidth).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.canvasHeight).toBeGreaterThan(0);
  });

  it('tanks have starting fuel', () => {
    expect(DEFAULT_CONFIG.tankFuel).toBeGreaterThan(0);
  });

  it('tanks have starting health', () => {
    expect(DEFAULT_CONFIG.tankHealth).toBeGreaterThan(0);
  });

  it('has gravity for bullet arcs', () => {
    expect(DEFAULT_CONFIG.gravity).toBeGreaterThan(0);
  });
});

describe('Game States', () => {
  it('has tank selection state', () => {
    expect(GameState.TankSelect).toBeDefined();
  });

  it('has playing state', () => {
    expect(GameState.Playing).toBeDefined();
  });

  it('has game over state', () => {
    expect(GameState.GameOver).toBeDefined();
  });
});

describe('Player Sides', () => {
  it('has left and right sides for 2 players', () => {
    expect(PlayerSide.Left).toBeDefined();
    expect(PlayerSide.Right).toBeDefined();
  });
});

describe('Tank Type Definitions', () => {
  it('has exactly 3 tank types', () => {
    const types = Object.values(TankTypeName);
    expect(types).toHaveLength(3);
  });

  it('includes M48 GAU-AVENGER', () => {
    expect(TankTypeName.GauAvenger).toBeDefined();
    expect(TANK_TYPES[TankTypeName.GauAvenger]).toBeDefined();
  });

  it('includes ABRAMS', () => {
    expect(TankTypeName.Abrams).toBeDefined();
    expect(TANK_TYPES[TankTypeName.Abrams]).toBeDefined();
  });

  it('includes MAUS', () => {
    expect(TankTypeName.Maus).toBeDefined();
    expect(TANK_TYPES[TankTypeName.Maus]).toBeDefined();
  });

  it('all tank types have required properties', () => {
    for (const type of Object.values(TANK_TYPES)) {
      expect(type.name).toBeDefined();
      expect(type.damage).toBeGreaterThan(0);
      expect(type.bulletsPerShot).toBeGreaterThan(0);
      expect(type.fireCooldownTurns).toBeGreaterThan(0);
      expect(type.craterRadius).toBeGreaterThan(0);
      expect(type.color).toBeTruthy();
    }
  });
});
