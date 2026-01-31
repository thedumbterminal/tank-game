import { Vector2, GameConfig, PlayerSide } from './types';

export class Tank {
  public position: Vector2;
  public health: number;
  public angle: number;
  public power: number;
  public alive: boolean;

  private readonly side: PlayerSide;
  private readonly config: GameConfig;
  private readonly minX: number;
  private readonly maxX: number;

  constructor(side: PlayerSide, config: GameConfig) {
    this.side = side;
    this.config = config;
    this.health = config.tankHealth;
    this.alive = true;

    const startX = side === PlayerSide.Left
      ? config.canvasWidth * 0.15
      : config.canvasWidth * 0.85;

    this.position = {
      x: startX,
      y: config.groundLevel - config.tankHeight / 2, // will be overridden by snapToTerrain
    };

    // Default angle: left tank aims right-up, right tank aims left-up
    this.angle = side === PlayerSide.Left ? Math.PI / 4 : (3 * Math.PI) / 4;
    this.power = (config.minPower + config.maxPower) / 2;

    this.minX = config.tankWidth / 2;
    this.maxX = config.canvasWidth - config.tankWidth / 2;
  }

  get side_(): PlayerSide {
    return this.side;
  }

  move(direction: number, deltaTime: number): void {
    if (!this.alive) return;
    const newX = this.position.x + direction * this.config.tankSpeed * deltaTime;
    this.position.x = Math.max(this.minX, Math.min(this.maxX, newX));
  }

  adjustAngle(delta: number): void {
    if (!this.alive) return;
    this.angle = Math.max(
      this.config.minAngle,
      Math.min(this.config.maxAngle, this.angle + delta)
    );
  }

  adjustPower(delta: number): void {
    if (!this.alive) return;
    this.power = Math.max(
      this.config.minPower,
      Math.min(this.config.maxPower, this.power + delta)
    );
  }

  getTurretEnd(): Vector2 {
    return {
      x: this.position.x + Math.cos(this.angle) * this.config.turretLength,
      y: this.position.y - Math.sin(this.angle) * this.config.turretLength,
    };
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  snapToTerrain(terrainHeight: number): void {
    this.position.y = terrainHeight - this.config.tankHeight / 2;
  }

  getFireVelocity(): Vector2 {
    return {
      x: Math.cos(this.angle) * this.power,
      y: -Math.sin(this.angle) * this.power,
    };
  }
}
