import { Vector2, GameConfig } from './types';

export class Bullet {
  public position: Vector2;
  public velocity: Vector2;
  public active: boolean;
  public hitTerrain: boolean = false; // True if deactivated by terrain collision
  public readonly craterRadius: number;

  private readonly config: GameConfig;
  private readonly ownerIndex: number;

  constructor(position: Vector2, velocity: Vector2, ownerIndex: number, config: GameConfig, craterRadius: number = 15) {
    this.position = { ...position };
    this.velocity = { ...velocity };
    this.active = true;
    this.ownerIndex = ownerIndex;
    this.config = config;
    this.craterRadius = craterRadius;
  }

  get owner(): number {
    return this.ownerIndex;
  }

  update(deltaTime: number, getTerrainHeight?: (x: number) => number): void {
    if (!this.active) return;

    // Apply gravity to vertical velocity
    this.velocity.y += this.config.gravity * deltaTime;

    // Update position
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;

    // Check terrain collision
    const groundY = getTerrainHeight
      ? getTerrainHeight(this.position.x)
      : this.config.groundLevel;

    // Deactivate if out of bounds
    if (
      this.position.x < -50 ||
      this.position.x > this.config.canvasWidth + 50
    ) {
      this.active = false;
    }

    // Hit terrain - mark for crater creation
    if (this.position.y > groundY) {
      this.active = false;
      this.hitTerrain = true;
    }
  }

  getTrajectoryPoints(steps: number): Vector2[] {
    const points: Vector2[] = [];
    const dt = 0.05;
    let vx = this.velocity.x;
    let vy = this.velocity.y;
    let px = this.position.x;
    let py = this.position.y;

    for (let i = 0; i < steps; i++) {
      points.push({ x: px, y: py });
      vy += this.config.gravity * dt;
      px += vx * dt;
      py += vy * dt;

      if (py > this.config.groundLevel) break;
    }

    return points;
  }
}
