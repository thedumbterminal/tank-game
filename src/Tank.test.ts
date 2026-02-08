import { describe, it, expect } from 'vitest';
import { Tank } from './Tank';
import { DEFAULT_CONFIG, PlayerSide, TankTypeName, TANK_TYPES } from './types';

const config = DEFAULT_CONFIG;

describe('Tank Movement', () => {
  it('moves forward (right) when given positive direction', () => {
    const tank = new Tank(PlayerSide.Left, config);
    const startX = tank.position.x;
    tank.move(1, 0.1);
    expect(tank.position.x).toBeGreaterThan(startX);
  });

  it('moves backward (left) when given negative direction', () => {
    const tank = new Tank(PlayerSide.Left, config);
    // Move right first so we have room to move left
    tank.move(1, 1);
    const midX = tank.position.x;
    tank.move(-1, 0.1);
    expect(tank.position.x).toBeLessThan(midX);
  });

  it('consumes fuel when moving', () => {
    const tank = new Tank(PlayerSide.Left, config);
    const startFuel = tank.fuel;
    tank.move(1, 0.5);
    expect(tank.fuel).toBeLessThan(startFuel);
  });

  it('cannot move when fuel is depleted', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.fuel = 0;
    const startX = tank.position.x;
    tank.move(1, 0.5);
    expect(tank.position.x).toBe(startX);
  });

  it('fuel does not go below zero', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.fuel = 0.01;
    tank.move(1, 10);
    expect(tank.fuel).toBe(0);
  });

  it('cannot move when dead', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.alive = false;
    const startX = tank.position.x;
    tank.move(1, 0.5);
    expect(tank.position.x).toBe(startX);
  });

  it('is clamped to canvas bounds', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.fuel = 10000;
    // Move far right
    for (let i = 0; i < 100; i++) tank.move(1, 1);
    expect(tank.position.x).toBeLessThanOrEqual(config.canvasWidth - config.tankWidth / 2);

    // Move far left
    for (let i = 0; i < 200; i++) tank.move(-1, 1);
    expect(tank.position.x).toBeGreaterThanOrEqual(config.tankWidth / 2);
  });
});

describe('Tank Fuel Gauge', () => {
  it('starts with full fuel', () => {
    const tank = new Tank(PlayerSide.Left, config);
    expect(tank.fuel).toBe(config.tankFuel);
  });

  it('maxFuel returns starting fuel value', () => {
    const tank = new Tank(PlayerSide.Left, config);
    expect(tank.maxFuel).toBe(config.tankFuel);
  });

  it('fuel ratio can be computed for gauge display', () => {
    const tank = new Tank(PlayerSide.Left, config);
    expect(tank.fuel / tank.maxFuel).toBe(1);
    tank.fuel = config.tankFuel / 2;
    expect(tank.fuel / tank.maxFuel).toBe(0.5);
  });
});

describe('Tank Health and Damage', () => {
  it('starts with full health', () => {
    const tank = new Tank(PlayerSide.Left, config);
    expect(tank.health).toBe(config.tankHealth);
  });

  it('takes damage correctly', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.takeDamage(35);
    expect(tank.health).toBe(config.tankHealth - 35);
    expect(tank.alive).toBe(true);
  });

  it('dies when health reaches zero', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.takeDamage(config.tankHealth);
    expect(tank.health).toBe(0);
    expect(tank.alive).toBe(false);
  });

  it('health does not go below zero', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.takeDamage(config.tankHealth + 50);
    expect(tank.health).toBe(0);
  });
});

describe('Tank Angle and Power', () => {
  it('adjusts angle within bounds', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.angle = Math.PI / 2;
    tank.adjustAngle(0.1);
    expect(tank.angle).toBeCloseTo(Math.PI / 2 + 0.1);
  });

  it('clamps angle to min/max', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.adjustAngle(-100);
    expect(tank.angle).toBeGreaterThanOrEqual(config.minAngle);
    tank.adjustAngle(200);
    expect(tank.angle).toBeLessThanOrEqual(config.maxAngle);
  });

  it('adjusts power within bounds', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.adjustPower(50);
    expect(tank.power).toBeGreaterThan(config.minPower);
    expect(tank.power).toBeLessThanOrEqual(config.maxPower);
  });

  it('clamps power to min/max', () => {
    const tank = new Tank(PlayerSide.Left, config);
    tank.adjustPower(-10000);
    expect(tank.power).toBe(config.minPower);
    tank.adjustPower(100000);
    expect(tank.power).toBe(config.maxPower);
  });
});

describe('Tank Types', () => {
  it('M48 GAU-AVENGER fires 10 bullets per shot', () => {
    const type = TANK_TYPES[TankTypeName.GauAvenger];
    expect(type.bulletsPerShot).toBe(10);
  });

  it('M48 GAU-AVENGER does 5 damage per bullet', () => {
    const type = TANK_TYPES[TankTypeName.GauAvenger];
    expect(type.damage).toBe(5);
  });

  it('M48 GAU-AVENGER has high velocity', () => {
    const type = TANK_TYPES[TankTypeName.GauAvenger];
    expect(type.bulletVelocityMultiplier).toBeGreaterThan(1);
  });

  it('M48 GAU-AVENGER fires bullets sequentially (has fire delay)', () => {
    const type = TANK_TYPES[TankTypeName.GauAvenger];
    expect(type.bulletFireDelay).toBeGreaterThan(0);
  });

  it('ABRAMS does 35 damage per bullet', () => {
    const type = TANK_TYPES[TankTypeName.Abrams];
    expect(type.damage).toBe(35);
  });

  it('ABRAMS fires 1 bullet per attack', () => {
    const type = TANK_TYPES[TankTypeName.Abrams];
    expect(type.bulletsPerShot).toBe(1);
  });

  it('MAUS does 50 damage per bullet', () => {
    const type = TANK_TYPES[TankTypeName.Maus];
    expect(type.damage).toBe(50);
  });

  it('MAUS can only fire every 2 turns', () => {
    const type = TANK_TYPES[TankTypeName.Maus];
    expect(type.fireCooldownTurns).toBe(2);
  });

  it('MAUS creates a larger crater', () => {
    const maus = TANK_TYPES[TankTypeName.Maus];
    const abrams = TANK_TYPES[TankTypeName.Abrams];
    expect(maus.craterRadius).toBeGreaterThan(abrams.craterRadius);
  });

  it('there are exactly 3 tank types', () => {
    expect(Object.keys(TANK_TYPES)).toHaveLength(3);
  });

  it('tank is constructed with the correct type', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    expect(tank.tankType.name).toBe(TankTypeName.Maus);
  });
});

describe('Tank Fire Cooldown', () => {
  it('can fire by default', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    expect(tank.canFire).toBe(true);
  });

  it('MAUS enters cooldown after firing', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    tank.onFired();
    expect(tank.canFire).toBe(false);
    expect(tank.fireCooldownRemaining).toBe(2);
  });

  it('MAUS cannot fire on the turn immediately after firing', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    tank.onFired();
    tank.onTurnStart(); // next MAUS turn
    expect(tank.canFire).toBe(false);
  });

  it('MAUS can fire again after 2 turns (fires every 2 turns)', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    tank.onFired();
    tank.onTurnStart(); // turn 1 after firing - still on cooldown
    expect(tank.canFire).toBe(false);
    tank.onTurnStart(); // turn 2 after firing - ready
    expect(tank.canFire).toBe(true);
  });

  it('ABRAMS can fire every turn (cooldown resets after 1 turn)', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Abrams);
    tank.onFired();
    expect(tank.canFire).toBe(false);
    tank.onTurnStart();
    expect(tank.canFire).toBe(true);
  });

  it('reloading tank reports canFire=false so fire button can end turn', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Maus);
    tank.onFired();
    tank.onTurnStart(); // still reloading
    expect(tank.canFire).toBe(false);
    // Game uses !canFire to trigger turn switch when fire button pressed
  });
});

describe('Tank Firing Velocity', () => {
  it('fire velocity accounts for angle and power', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.Abrams);
    tank.angle = Math.PI / 4;
    tank.power = 400;
    const vel = tank.getFireVelocity();
    expect(vel.x).toBeCloseTo(Math.cos(Math.PI / 4) * 400 * 1.0);
    expect(vel.y).toBeCloseTo(-Math.sin(Math.PI / 4) * 400 * 1.0);
  });

  it('fire velocity includes tank type velocity multiplier', () => {
    const tank = new Tank(PlayerSide.Left, config, TankTypeName.GauAvenger);
    tank.angle = Math.PI / 4;
    tank.power = 400;
    const vel = tank.getFireVelocity();
    const mult = TANK_TYPES[TankTypeName.GauAvenger].bulletVelocityMultiplier;
    expect(vel.x).toBeCloseTo(Math.cos(Math.PI / 4) * 400 * mult);
  });
});
