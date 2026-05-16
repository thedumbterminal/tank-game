import { Tank } from './Tank';
import { GameConfig, LevelConfig } from './types';

export class BotController {
  private readonly config: GameConfig;
  private actionTimer: number = 0;
  private actionInterval: number = 0.5;
  private moveTimeRemaining: number = 0;
  private moveDirection: number = 0;
  private jitter: number = 0.08;
  private angleThreshold: number = 0.15;
  private powerThreshold: number = 40;

  constructor(config: GameConfig) {
    this.config = config;
  }

  setDifficulty(levelConfig: LevelConfig): void {
    this.actionInterval = levelConfig.botActionInterval;
    this.jitter = levelConfig.botJitter;
    this.angleThreshold = levelConfig.botAngleThreshold;
    this.powerThreshold = levelConfig.botPowerThreshold;
  }

  /** Called at the start of each bot turn to reset movement phase. */
  startTurn(): void {
    this.moveTimeRemaining = 0.3 + Math.random() * 0.4; // Move for 0.3-0.7 seconds
    this.moveDirection = Math.random() < 0.5 ? -1 : 1;
    this.actionTimer = 0;
  }

  /** Returns true when bot wants to fire. Handles movement first, then aiming. */
  update(botTank: Tank, targetTank: Tank, deltaTime: number, getTerrainHeight: (x: number) => number): boolean {
    // Movement phase: move the tank before aiming
    if (this.moveTimeRemaining > 0) {
      this.moveTimeRemaining -= deltaTime;
      if (botTank.fuel > 0) {
        botTank.move(this.moveDirection, deltaTime);
        botTank.snapToTerrain(getTerrainHeight(botTank.position.x));
      }
      return false;
    }

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
    const jitter = (Math.random() - 0.5) * this.jitter;
    botTank.adjustAngle(angleDiff * 0.3 + jitter);

    // Adjust power based on distance
    const idealPower = Math.min(
      this.config.maxPower,
      Math.max(this.config.minPower, distance * 0.8)
    );
    const powerDiff = idealPower - botTank.power;
    botTank.adjustPower(powerDiff * 0.3 + (Math.random() - 0.5) * 20);

    // Fire when angle is roughly correct
    if (Math.abs(angleDiff) < this.angleThreshold && Math.abs(powerDiff) < this.powerThreshold) {
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
