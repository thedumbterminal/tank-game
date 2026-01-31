import { Tank } from './Tank';
import { GameConfig } from './types';

export class BotController {
  private readonly config: GameConfig;
  private actionTimer: number = 0;
  private readonly actionInterval: number = 0.5;

  constructor(config: GameConfig) {
    this.config = config;
  }

  update(botTank: Tank, targetTank: Tank, deltaTime: number): boolean {
    this.actionTimer += deltaTime;

    if (this.actionTimer < this.actionInterval) return false;
    this.actionTimer = 0;

    // Calculate ideal angle to hit the target
    const dx = targetTank.position.x - botTank.position.x;
    const dy = targetTank.position.y - botTank.position.y;
    const distance = Math.abs(dx);

    // Simple angle calculation: aim based on distance
    const idealAngle = this.calculateAngle(distance, dx, dy, botTank.power);

    // Adjust angle toward ideal with some randomness
    const angleDiff = idealAngle - botTank.angle;
    const jitter = (Math.random() - 0.5) * 0.08;
    botTank.adjustAngle(angleDiff * 0.3 + jitter);

    // Adjust power based on distance
    const idealPower = Math.min(
      this.config.maxPower,
      Math.max(this.config.minPower, distance * 0.8)
    );
    const powerDiff = idealPower - botTank.power;
    botTank.adjustPower(powerDiff * 0.3 + (Math.random() - 0.5) * 20);

    // Fire when angle is roughly correct
    if (Math.abs(angleDiff) < 0.15 && Math.abs(powerDiff) < 40) {
      return true; // Signal to fire
    }

    return false;
  }

  private calculateAngle(distance: number, dx: number, _dy: number, power: number): number {
    // Use projectile motion formula to estimate angle
    // For a simplified calculation: angle = atan2(gd, v^2) / 2
    const g = this.config.gravity;
    const v = power;
    const discriminant = v * v * v * v - g * (g * distance * distance);

    if (discriminant < 0) {
      // Target too far, aim at 45 degrees
      return dx > 0 ? Math.PI / 4 : (3 * Math.PI) / 4;
    }

    const angle = Math.atan2(v * v - Math.sqrt(discriminant), g * distance);

    // Adjust for direction
    if (dx < 0) {
      return Math.PI - angle;
    }
    return angle;
  }
}
