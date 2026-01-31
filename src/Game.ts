import { GameConfig, GameState, PlayerSide, TankTypeName, TANK_TYPES, DEFAULT_CONFIG } from './types';
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
  private state: GameState = GameState.TankSelect;
  private activeTankIndex: number = 0;
  private winnerIndex: number = -1;
  private isBotGame: boolean = true;
  private lastTime: number = 0;
  private shotFired: boolean = false;
  private turnCooldown: number = 0;

  // Tank selection state
  private readonly tankTypeOptions = [TankTypeName.GauAvenger, TankTypeName.Abrams, TankTypeName.Maus];
  private selectedTankIndex: number = 1; // Default to Abrams
  private playerTankType: TankTypeName = TankTypeName.Abrams;

  constructor(canvas: HTMLCanvasElement, config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');
    this.ctx = ctx;

    this.input = new InputHandler();
    this.botController = new BotController(config);

    this.terrain = new Terrain(this.config);
    this.renderer = new Renderer(this.ctx, this.config, this.terrain);
  }

  private initMatch(): void {
    this.terrain = new Terrain(this.config);
    this.renderer = new Renderer(this.ctx, this.config, this.terrain);

    // Bot picks a random tank type
    const botType = this.tankTypeOptions[Math.floor(Math.random() * this.tankTypeOptions.length)];

    this.tanks = [
      new Tank(PlayerSide.Left, this.config, this.playerTankType),
      new Tank(PlayerSide.Right, this.config, botType),
    ];

    for (const tank of this.tanks) {
      tank.snapToTerrain(this.terrain.getHeightAt(tank.position.x));
    }

    this.bullets = [];
    this.state = GameState.Playing;
    this.activeTankIndex = 0;
    this.winnerIndex = -1;
    this.shotFired = false;
    this.turnCooldown = 0;

    // Notify first tank of turn start
    this.tanks[0].onTurnStart();
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
    if (this.state === GameState.TankSelect) {
      this.updateTankSelect();
      return;
    }

    if (this.state === GameState.GameOver) {
      if (this.input.wasPressed('r') || this.input.wasPressed('R')) {
        this.state = GameState.TankSelect;
        this.selectedTankIndex = 1;
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
      if (!activeTank.canFire) {
        // MAUS cooldown: skip turn
        this.switchTurn();
        return;
      }
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

  private updateTankSelect(): void {
    if (this.input.wasPressed('a') || this.input.wasPressed('A') || this.input.wasPressed('ArrowLeft')) {
      this.selectedTankIndex = (this.selectedTankIndex - 1 + this.tankTypeOptions.length) % this.tankTypeOptions.length;
    }
    if (this.input.wasPressed('d') || this.input.wasPressed('D') || this.input.wasPressed('ArrowRight')) {
      this.selectedTankIndex = (this.selectedTankIndex + 1) % this.tankTypeOptions.length;
    }
    if (this.input.wasPressed('Enter') || this.input.wasPressed(' ')) {
      this.playerTankType = this.tankTypeOptions[this.selectedTankIndex];
      this.initMatch();
    }
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
    if (this.input.wasPressed(' ') && !this.shotFired && tank.canFire) {
      this.fire(tank, this.activeTankIndex);
    }
  }

  private fire(tank: Tank, ownerIndex: number): void {
    const turretEnd = tank.getTurretEnd();
    const baseVelocity = tank.getFireVelocity();
    const bulletsPerShot = tank.tankType.bulletsPerShot;
    const spread = tank.tankType.bulletSpread;

    for (let i = 0; i < bulletsPerShot; i++) {
      let vx = baseVelocity.x;
      let vy = baseVelocity.y;

      if (bulletsPerShot > 1) {
        // Spread bullets in a fan pattern
        const spreadAngle = (i / (bulletsPerShot - 1) - 0.5) * spread;
        const cos = Math.cos(spreadAngle);
        const sin = Math.sin(spreadAngle);
        const newVx = vx * cos - vy * sin;
        const newVy = vx * sin + vy * cos;
        vx = newVx;
        vy = newVy;
      }

      this.bullets.push(new Bullet(
        { x: turretEnd.x, y: turretEnd.y },
        { x: vx, y: vy },
        ownerIndex,
        this.config
      ));
    }

    tank.onFired();
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
        if (i === bullet.owner) continue;
        const tank = this.tanks[i];
        if (!tank.alive) continue;

        const dx = bullet.position.x - tank.position.x;
        const dy = bullet.position.y - tank.position.y;
        const hitRadius = this.config.tankWidth / 2;

        if (Math.abs(dx) < hitRadius && Math.abs(dy) < this.config.tankHeight) {
          // Use damage from the firing tank's type
          const firingTank = this.tanks[bullet.owner];
          tank.takeDamage(firingTank.tankType.damage);
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
    this.tanks[this.activeTankIndex].onTurnStart();
    this.shotFired = false;
    this.turnCooldown = 0;
  }

  private render(): void {
    if (this.state === GameState.TankSelect) {
      this.renderer.renderTankSelect(this.tankTypeOptions, this.selectedTankIndex);
      return;
    }

    this.renderer.renderScene(this.tanks, this.bullets, this.activeTankIndex);

    if (this.state === GameState.GameOver) {
      this.renderer.renderGameOver(this.winnerIndex);
    }
  }
}
