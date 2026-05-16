import { GameConfig, GameState, PlayerSide, TankTypeName, Vector2, DEFAULT_CONFIG, LeaderboardEntry } from './types';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { Terrain } from './Terrain';
import { Renderer } from './Renderer';
import { InputHandler } from './InputHandler';
import { BotController } from './BotController';
import { LevelManager } from './LevelManager';
import { SaveManager } from './SaveManager';

interface QueuedBullet {
  position: Vector2;
  velocity: Vector2;
  ownerIndex: number;
  delay: number; // seconds until this bullet fires
  craterRadius: number;
}

export class Game {
  private readonly config: GameConfig;
  private readonly input: InputHandler;
  private readonly botController: BotController;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly levelManager: LevelManager;
  private readonly saveManager: SaveManager;

  private renderer!: Renderer;
  private terrain!: Terrain;
  private tanks: Tank[] = [];
  private bullets: Bullet[] = [];
  private bulletQueue: QueuedBullet[] = []; // For sequential firing
  private state: GameState = GameState.MainMenu;
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

  // Main menu state
  private selectedMenuIndex: number = 0;

  // Leaderboard / name entry state
  private currentLeaderboard: LeaderboardEntry[] = [];
  private pendingLeaderboardLevel: number = 1;
  private nameInputEl: HTMLInputElement | null = null;

  private readonly canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, config: GameConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.canvas = canvas;
    canvas.width = config.canvasWidth;
    canvas.height = config.canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2d context');
    this.ctx = ctx;

    this.input = new InputHandler();
    this.botController = new BotController(config);
    this.levelManager = new LevelManager();
    this.saveManager = new SaveManager();

    this.terrain = new Terrain(this.config);
    this.renderer = new Renderer(this.ctx, this.config, this.terrain);

    this.initCanvasTouch();
  }

  /** Convert a touch/click event to canvas-space coordinates */
  private canvasCoordsFromEvent(e: MouseEvent | Touch): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.config.canvasWidth / rect.width;
    const scaleY = this.config.canvasHeight / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  /** Handle canvas taps for all screen states */
  private initCanvasTouch(): void {
    const handleTap = (x: number, y: number) => {
      if (this.state === GameState.TankSelect) {
        this.handleTankSelectTap(x, y);
      } else if (this.state === GameState.GameOver || this.state === GameState.Leaderboard) {
        this.state = GameState.MainMenu;
        this.selectedMenuIndex = 0;
      } else if (this.state === GameState.MainMenu) {
        this.handleMainMenuTap(x, y);
      } else if (this.state === GameState.LevelComplete) {
        this.levelManager.advance();
        this.state = GameState.TankSelect;
        this.selectedTankIndex = 1;
      }
    };

    this.canvas.addEventListener('click', (e) => {
      const pos = this.canvasCoordsFromEvent(e);
      handleTap(pos.x, pos.y);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (e.touches.length === 1) {
        const pos = this.canvasCoordsFromEvent(e.touches[0]);
        handleTap(pos.x, pos.y);
      }
    }, { passive: false });
  }

  private handleMainMenuTap(x: number, y: number): void {
    const options = this.getMenuOptions();
    const itemH = 60;
    const startY = this.config.canvasHeight / 2 - (options.length * itemH) / 2;
    for (let i = 0; i < options.length; i++) {
      const itemY = startY + i * itemH;
      if (y >= itemY - 10 && y <= itemY + itemH - 10) {
        this.selectMenuOption(i);
        return;
      }
    }
  }

  private getMenuOptions(): string[] {
    const save = this.saveManager.load();
    const options: string[] = ['New Game'];
    if (save.lastCompletedLevel > 0) {
      options.push(`Continue (Level ${save.lastCompletedLevel + 1})`);
    }
    options.push('Leaderboard');
    return options;
  }

  private selectMenuOption(index: number): void {
    const save = this.saveManager.load();
    const hasSave = save.lastCompletedLevel > 0;

    let action: 'new' | 'continue' | 'leaderboard';
    if (!hasSave) {
      // Options: [0]=New Game, [1]=Leaderboard
      action = index === 0 ? 'new' : 'leaderboard';
    } else {
      // Options: [0]=New Game, [1]=Continue, [2]=Leaderboard
      if (index === 0) action = 'new';
      else if (index === 1) action = 'continue';
      else action = 'leaderboard';
    }

    if (action === 'new') {
      this.levelManager.reset();
      this.state = GameState.TankSelect;
      this.selectedTankIndex = 1;
    } else if (action === 'continue') {
      this.levelManager.setLevel(save.lastCompletedLevel + 1);
      this.state = GameState.TankSelect;
      this.selectedTankIndex = 1;
    } else {
      this.currentLeaderboard = save.leaderboard;
      this.state = GameState.Leaderboard;
    }
  }

  private handleTankSelectTap(x: number, y: number): void {
    const cardWidth = 240;
    const cardHeight = 270;
    const gap = 40;
    const totalWidth = this.tankTypeOptions.length * cardWidth + (this.tankTypeOptions.length - 1) * gap;
    const startX = (this.config.canvasWidth - totalWidth) / 2;
    const cardY = 120;

    for (let i = 0; i < this.tankTypeOptions.length; i++) {
      const cardX = startX + i * (cardWidth + gap);
      if (x >= cardX && x <= cardX + cardWidth && y >= cardY && y <= cardY + cardHeight) {
        if (this.selectedTankIndex === i) {
          this.playerTankType = this.tankTypeOptions[this.selectedTankIndex];
          this.initMatch();
        } else {
          this.selectedTankIndex = i;
        }
        return;
      }
    }
  }

  private initMatch(): void {
    this.terrain = new Terrain(this.config);
    this.renderer = new Renderer(this.ctx, this.config, this.terrain);

    const levelConfig = this.levelManager.getLevelConfig(this.levelManager.currentLevel);
    this.botController.setDifficulty(levelConfig);

    const botType = this.tankTypeOptions[Math.floor(Math.random() * this.tankTypeOptions.length)];

    const playerTank = new Tank(PlayerSide.Left, this.config, this.playerTankType);
    const botTank = new Tank(PlayerSide.Right, this.config, botType);
    botTank.health = Math.round(this.config.tankHealth * levelConfig.botHealthMultiplier);

    this.tanks = [playerTank, botTank];

    for (const tank of this.tanks) {
      tank.snapToTerrain(this.terrain.getHeightAt(tank.position.x));
    }

    this.bullets = [];
    this.bulletQueue = [];
    this.state = GameState.Playing;
    this.activeTankIndex = 0;
    this.winnerIndex = -1;
    this.shotFired = false;
    this.turnCooldown = 0;

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
    if (this.state === GameState.MainMenu) {
      this.updateMainMenu();
      return;
    }

    if (this.state === GameState.TankSelect) {
      this.updateTankSelect();
      return;
    }

    if (this.state === GameState.LevelComplete) {
      if (this.input.wasPressed(' ') || this.input.wasPressed('Enter')) {
        this.levelManager.advance();
        this.state = GameState.TankSelect;
        this.selectedTankIndex = 1;
      }
      return;
    }

    if (this.state === GameState.NameEntry) {
      // Name entry is handled via HTML input element
      return;
    }

    if (this.state === GameState.GameOver || this.state === GameState.Leaderboard) {
      if (this.input.wasPressed('r') || this.input.wasPressed('R')) {
        this.state = GameState.MainMenu;
        this.selectedMenuIndex = 0;
      }
      return;
    }

    this.updateBulletQueue(deltaTime);
    this.updateBullets(deltaTime);
    this.checkCollisions();

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
        this.switchTurn();
        return;
      }
      const shouldFire = this.botController.update(
        activeTank,
        this.tanks[0],
        deltaTime,
        (x: number) => this.terrain.getHeightAt(x)
      );
      if (shouldFire && !this.shotFired) {
        this.fire(activeTank, this.activeTankIndex);
      }
      return;
    }

    this.handlePlayerInput(activeTank, deltaTime);
  }

  private updateMainMenu(): void {
    const options = this.getMenuOptions();
    if (this.input.wasPressed('a') || this.input.wasPressed('A') ||
        this.input.wasPressed('ArrowLeft') || this.input.wasPressed('ArrowUp') ||
        this.input.wasPressed('w') || this.input.wasPressed('W')) {
      this.selectedMenuIndex = (this.selectedMenuIndex - 1 + options.length) % options.length;
    }
    if (this.input.wasPressed('d') || this.input.wasPressed('D') ||
        this.input.wasPressed('ArrowRight') || this.input.wasPressed('ArrowDown') ||
        this.input.wasPressed('s') || this.input.wasPressed('S')) {
      this.selectedMenuIndex = (this.selectedMenuIndex + 1) % options.length;
    }
    if (this.input.wasPressed('Enter') || this.input.wasPressed(' ')) {
      this.selectMenuOption(this.selectedMenuIndex);
    }
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
    if (!this.shotFired) {
      if (this.input.isDown('a') || this.input.isDown('A') || this.input.isDown('ArrowLeft')) {
        tank.move(-1, deltaTime);
        tank.snapToTerrain(this.terrain.getHeightAt(tank.position.x));
      }
      if (this.input.isDown('d') || this.input.isDown('D') || this.input.isDown('ArrowRight')) {
        tank.move(1, deltaTime);
        tank.snapToTerrain(this.terrain.getHeightAt(tank.position.x));
      }
    }

    const angleSpeed = 1.5 * deltaTime;
    if (this.input.isDown('w') || this.input.isDown('W') || this.input.isDown('ArrowUp')) {
      tank.adjustAngle(angleSpeed);
    }
    if (this.input.isDown('s') || this.input.isDown('S') || this.input.isDown('ArrowDown')) {
      tank.adjustAngle(-angleSpeed);
    }

    const powerSpeed = 200 * deltaTime;
    if (this.input.isDown('q') || this.input.isDown('Q')) {
      tank.adjustPower(-powerSpeed);
    }
    if (this.input.isDown('e') || this.input.isDown('E')) {
      tank.adjustPower(powerSpeed);
    }

    if (this.input.wasPressed(' ') && !this.shotFired) {
      if (tank.canFire) {
        this.fire(tank, this.activeTankIndex);
      } else {
        this.switchTurn();
      }
    }
  }

  private fire(tank: Tank, ownerIndex: number): void {
    const turretEnd = tank.getTurretEnd();
    const baseVelocity = tank.getFireVelocity();
    const bulletsPerShot = tank.tankType.bulletsPerShot;
    const spread = tank.tankType.bulletSpread;
    const fireDelay = tank.tankType.bulletFireDelay;
    const craterRadius = tank.tankType.craterRadius;

    for (let i = 0; i < bulletsPerShot; i++) {
      let vx = baseVelocity.x;
      let vy = baseVelocity.y;

      if (bulletsPerShot > 1) {
        const spreadAngle = (i / (bulletsPerShot - 1) - 0.5) * spread;
        const cos = Math.cos(spreadAngle);
        const sin = Math.sin(spreadAngle);
        const newVx = vx * cos - vy * sin;
        const newVy = vx * sin + vy * cos;
        vx = newVx;
        vy = newVy;
      }

      if (fireDelay > 0 && i > 0) {
        this.bulletQueue.push({
          position: { x: turretEnd.x, y: turretEnd.y },
          velocity: { x: vx, y: vy },
          ownerIndex,
          delay: i * fireDelay,
          craterRadius,
        });
      } else {
        this.bullets.push(new Bullet(
          { x: turretEnd.x, y: turretEnd.y },
          { x: vx, y: vy },
          ownerIndex,
          this.config,
          craterRadius
        ));
      }
    }

    tank.onFired();
    this.shotFired = true;
    this.turnCooldown = 0.3;
  }

  private updateBulletQueue(deltaTime: number): void {
    const toFire: QueuedBullet[] = [];

    for (const queued of this.bulletQueue) {
      queued.delay -= deltaTime;
      if (queued.delay <= 0) {
        toFire.push(queued);
      }
    }

    this.bulletQueue = this.bulletQueue.filter((q) => q.delay > 0);

    for (const q of toFire) {
      this.bullets.push(new Bullet(
        q.position,
        q.velocity,
        q.ownerIndex,
        this.config
      ));
    }
  }

  private updateBullets(deltaTime: number): void {
    const getHeight = (x: number) => this.terrain.getHeightAt(x);
    this.bullets.forEach((bullet) => bullet.update(deltaTime, getHeight));

    for (const bullet of this.bullets) {
      if (!bullet.active && bullet.hitTerrain) {
        this.terrain.createCrater(bullet.position.x);
      }
    }

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
          const firingTank = this.tanks[bullet.owner];
          tank.takeDamage(firingTank.tankType.damage);
          bullet.active = false;

          if (!tank.alive) {
            this.winnerIndex = bullet.owner;
            if (bullet.owner === 0) {
              // Player wins
              this.saveManager.saveCompletedLevel(this.levelManager.currentLevel);
              this.state = GameState.LevelComplete;
            } else {
              // Bot wins — player loses
              this.pendingLeaderboardLevel = this.levelManager.currentLevel;
              this.state = GameState.NameEntry;
              this.showNameInput();
            }
          }
        }
      }
    }
  }

  private hasBulletsInFlight(): boolean {
    return this.bullets.some((b) => b.active) || this.bulletQueue.length > 0;
  }

  private switchTurn(): void {
    this.activeTankIndex = this.activeTankIndex === 0 ? 1 : 0;
    this.tanks[this.activeTankIndex].onTurnStart();
    this.shotFired = false;
    this.turnCooldown = 0;

    if (this.isBotGame && this.activeTankIndex === 1) {
      this.botController.startTurn();
    }
  }

  // ---- Name entry HTML overlay ----

  private showNameInput(): void {
    this.hideNameInput();

    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 16;
    input.placeholder = 'Enter your name';
    input.id = 'tank-name-input';

    const rect = this.canvas.getBoundingClientRect();
    input.style.position = 'fixed';
    input.style.left = `${rect.left + rect.width / 2 - 100}px`;
    input.style.top = `${rect.top + rect.height / 2}px`;
    input.style.width = '200px';
    input.style.fontSize = '20px';
    input.style.textAlign = 'center';
    input.style.zIndex = '100';
    input.style.padding = '6px';
    input.style.border = '2px solid #FFD700';
    input.style.background = '#111';
    input.style.color = '#FFF';
    input.style.borderRadius = '4px';
    input.style.outline = 'none';

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.submitName(input.value.trim() || 'UNKNOWN');
    });

    document.body.appendChild(input);
    this.nameInputEl = input;

    setTimeout(() => input.focus(), 50);
  }

  private hideNameInput(): void {
    if (this.nameInputEl) {
      this.nameInputEl.remove();
      this.nameInputEl = null;
    }
    const existing = document.getElementById('tank-name-input');
    if (existing) existing.remove();
  }

  private submitName(name: string): void {
    this.hideNameInput();
    const updatedData = this.saveManager.addLeaderboardEntry(name, this.pendingLeaderboardLevel);
    this.currentLeaderboard = updatedData.leaderboard;
    this.levelManager.reset();
    this.state = GameState.GameOver;
  }

  private render(): void {
    const touchControls = document.getElementById('touch-controls');

    if (this.state === GameState.MainMenu) {
      if (touchControls) touchControls.style.visibility = 'hidden';
      const save = this.saveManager.load();
      this.renderer.renderMainMenu(
        this.getMenuOptions(),
        this.selectedMenuIndex,
        save.lastCompletedLevel > 0,
        save.lastCompletedLevel + 1
      );
      return;
    }

    if (this.state === GameState.TankSelect) {
      if (touchControls) touchControls.style.visibility = 'hidden';
      this.renderer.renderTankSelect(this.tankTypeOptions, this.selectedTankIndex);
      return;
    }

    if (this.state === GameState.LevelComplete) {
      if (touchControls) touchControls.style.visibility = 'hidden';
      this.renderer.renderScene(this.tanks, this.bullets, this.activeTankIndex, this.levelManager.currentLevel);
      this.renderer.renderLevelComplete(this.levelManager.currentLevel);
      return;
    }

    if (this.state === GameState.NameEntry) {
      if (touchControls) touchControls.style.visibility = 'hidden';
      this.renderer.renderScene(this.tanks, this.bullets, this.activeTankIndex, this.levelManager.currentLevel);
      this.renderer.renderNameEntryPrompt();
      return;
    }

    if (this.state === GameState.GameOver) {
      if (touchControls) touchControls.style.visibility = 'hidden';
      this.renderer.renderLeaderboard(this.currentLeaderboard, false);
      return;
    }

    if (this.state === GameState.Leaderboard) {
      if (touchControls) touchControls.style.visibility = 'hidden';
      const save = this.saveManager.load();
      this.renderer.renderLeaderboard(save.leaderboard, true);
      return;
    }

    // Playing state
    this.renderer.renderScene(this.tanks, this.bullets, this.activeTankIndex, this.levelManager.currentLevel);
    if (touchControls) touchControls.style.visibility = '';
  }
}
