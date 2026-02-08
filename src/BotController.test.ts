import { describe, it, expect } from 'vitest';
import { BotController } from './BotController';
import { Tank } from './Tank';
import { DEFAULT_CONFIG, PlayerSide, TankTypeName } from './types';

const config = DEFAULT_CONFIG;

describe('Bot Controller Movement', () => {
  it('moves the tank during movement phase after startTurn', () => {
    const bot = new BotController(config);
    const botTank = new Tank(PlayerSide.Right, config, TankTypeName.Abrams);
    const target = new Tank(PlayerSide.Left, config, TankTypeName.Abrams);
    const startX = botTank.position.x;
    const getHeight = () => config.groundLevel;

    bot.startTurn();

    // Run several small updates during movement phase
    for (let i = 0; i < 10; i++) {
      bot.update(botTank, target, 0.05, getHeight);
    }

    // Tank should have moved from its starting position
    expect(botTank.position.x).not.toBe(startX);
  });

  it('does not fire during movement phase', () => {
    const bot = new BotController(config);
    const botTank = new Tank(PlayerSide.Right, config, TankTypeName.Abrams);
    const target = new Tank(PlayerSide.Left, config, TankTypeName.Abrams);
    const getHeight = () => config.groundLevel;

    bot.startTurn();

    // During movement phase, update should return false (don't fire)
    const shouldFire = bot.update(botTank, target, 0.05, getHeight);
    expect(shouldFire).toBe(false);
  });

  it('does not move when fuel is empty', () => {
    const bot = new BotController(config);
    const botTank = new Tank(PlayerSide.Right, config, TankTypeName.Abrams);
    const target = new Tank(PlayerSide.Left, config, TankTypeName.Abrams);
    const startX = botTank.position.x;
    const getHeight = () => config.groundLevel;

    botTank.fuel = 0;
    bot.startTurn();

    for (let i = 0; i < 10; i++) {
      bot.update(botTank, target, 0.05, getHeight);
    }

    expect(botTank.position.x).toBe(startX);
  });

  it('transitions to aiming after movement phase completes', () => {
    const bot = new BotController(config);
    const botTank = new Tank(PlayerSide.Right, config, TankTypeName.Abrams);
    const target = new Tank(PlayerSide.Left, config, TankTypeName.Abrams);
    const getHeight = () => config.groundLevel;

    bot.startTurn();

    // Fast-forward past movement phase (max 0.7s)
    for (let i = 0; i < 20; i++) {
      bot.update(botTank, target, 0.05, getHeight);
    }

    // Now in aiming phase - should eventually want to fire
    let fired = false;
    for (let i = 0; i < 50; i++) {
      if (bot.update(botTank, target, 0.5, getHeight)) {
        fired = true;
        break;
      }
    }
    expect(fired).toBe(true);
  });
});
