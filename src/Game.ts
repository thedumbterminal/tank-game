import { GameConfig, GameState, PlayerSide, DEFAULT_CONFIG } from './types';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { Terrain } from './Terrain';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';
import { BotController } from './BotController';

export class Game {
  private readonly config: GameConfig;
  private readonly input: InputHandler;
  private readonly botController: BotController;
  private readonly ctx: CanvasRenderingContext2D;

  private renderer!: Renderer;
  private terrain!: Terrain;
  private tanks: Tank[] = [];
  private bullets: Bullet[] = [];
  private state: GameState = GameState.Playing;
  private activeTankIndex: number = 0;
  private winnerIndex: number = -1;
  private isBotGame: boolean = true;
  private lastTime: number = 0;
  private shotFired: boolean = false;
  private turnCooldown: number = 0;

  constructor(canvas: HTMLCanvasElement, config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');
    this.ctx = ctx;

    this.input = new InputHandler();
    this.botController = new BotController(config);

    this.init();
  }

  private init(): void {
    this.terrain = new Terrain(this.config);
    this.renderer = new Renderer(this.ctx, this.config, this.terrain);

    this.tanks = [
      new Tank(PlayerSide.Left, this.config),
      new Tank(PlayerSide.Right, this.config),
    ];

    // Snap tanks to terrain height at their starting positions
    for (const tank of this.tanks) {
      tank.snapToTerrain(this.terrain.getHeightAt(tank.position.x));
    }

    this.bullets = [];
    this.state = GameState.Playing;
    this.activeTankIndex = 0;
    this.winnerIndex = -1;
    this.shotFired = false;
    this.turnCooldown = 0;
  }

  start(): void {
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  private loop(timestamp: number): void {
    const deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    this.input.clearFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  private update(deltaTime: number): void {
    if (this.state === GameState.GameOver) {
      if (this.input.wasPressed('r') || this.input.wasPressed('R')) {
        this.init();
      }
      return;
    }

    this.updateBullets(deltaTime);
    this.checkCollisions();

    // Handle turn cooldown after a shot
    if (this.turnCooldown > 0) {
      this.turnCooldown -= deltaTime;
      if (this.turnCooldown <= 0 && !this.hasBulletsInFlight()) {
        this.switchTurn();
      }
      return;
    }

    if (this.shotFired && !this.hasBulletsInFlight()) {
      this.switchTurn();
      this.shotFired = false;
    }

    const activeTank = this.tanks[this.activeTankIndex];

    // Bot turn
    if (this.isBotGame && this.activeTankIndex === 1) {
      const shouldFire = this.botController.update(
        activeTank,
        this.tanks[0],
        deltaTime
      );
      if (shouldFire && !this.shotFired) {
        this.fire(activeTank, this.activeTankIndex);
      }
      return;
    }

    // Player controls
    this.handlePlayerInput(activeTank, deltaTime);
  }

  private handlePlayerInput(tank: Tank, deltaTime: number): void {
    // Movement
    if (this.input.isDown('a') || this.input.isDown('A') || this.input.isDown('ArrowLeft')) {
      tank.move(-1, deltaTime);
      tank.snapToTerrain(this.terrain.getHeightAt(tank.position.x));
    }
    if (this.input.isDown('d') || this.input.isDown('D') || this.input.isDown('ArrowRight')) {
      tank.move(1, deltaTime);
      tank.snapToTerrain(this.terrain.getHeightAt(tank.position.x));
    }

    // Angle adjustment
    const angleSpeed = 1.5 * deltaTime;
    if (this.input.isDown('w') || this.input.isDown('W') || this.input.isDown('ArrowUp')) {
      tank.adjustAngle(angleSpeed);
    }
    if (this.input.isDown('s') || this.input.isDown('S') || this.input.isDown('ArrowDown')) {
      tank.adjustAngle(-angleSpeed);
    }

    // Power adjustment
    const powerSpeed = 200 * deltaTime;
    if (this.input.isDown('q') || this.input.isDown('Q')) {
      tank.adjustPower(-powerSpeed);
    }
    if (this.input.isDown('e') || this.input.isDown('E')) {
      tank.adjustPower(powerSpeed);
    }

    // Fire
    if (this.input.wasPressed(' ') && !this.shotFired) {
      this.fire(tank, this.activeTankIndex);
    }
  }

  private fire(tank: Tank, ownerIndex: number): void {
    const turretEnd = tank.getTurretEnd();
    const velocity = tank.getFireVelocity();
    this.bullets.push(new Bullet(turretEnd, velocity, ownerIndex, this.config));
    this.shotFired = true;
    this.turnCooldown = 0.3;
  }

  private updateBullets(deltaTime: number): void {
    const getHeight = (x: number) => this.terrain.getHeightAt(x);
    this.bullets.forEach((bullet) => bullet.update(deltaTime, getHeight));
    this.bullets = this.bullets.filter((b) => b.active);
  }

  private checkCollisions(): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      for (let i = 0; i < this.tanks.length; i++) {
        if (i === bullet.owner) continue; // Don't hit self
        const tank = this.tanks[i];
        if (!tank.alive) continue;

        const dx = bullet.position.x - tank.position.x;
        const dy = bullet.position.y - tank.position.y;
        const hitRadius = this.config.tankWidth / 2;

        if (Math.abs(dx) < hitRadius && Math.abs(dy) < this.config.tankHeight) {
          tank.takeDamage(34);
          bullet.active = false;

          if (!tank.alive) {
            this.state = GameState.GameOver;
            this.winnerIndex = bullet.owner;
          }
        }
      }
    }
  }

  private hasBulletsInFlight(): boolean {
    return this.bullets.some((b) => b.active);
  }

  private switchTurn(): void {
    this.activeTankIndex = this.activeTankIndex === 0 ? 1 : 0;
    this.shotFired = false;
    this.turnCooldown = 0;
  }

  private render(): void {
    this.renderer.renderScene(this.tanks, this.bullets, this.activeTankIndex);

    if (this.state === GameState.GameOver) {
      this.renderer.renderGameOver(this.winnerIndex);
    }
  }
}
