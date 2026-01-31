import { GameConfig, PlayerSide } from './types';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { Terrain } from './Terrain';

export class Renderer {
  private readonly ctx: CanvasRenderingContext2D;
  private readonly config: GameConfig;
  private readonly terrain: Terrain;

  constructor(ctx: CanvasRenderingContext2D, config: GameConfig, terrain: Terrain) {
    this.ctx = ctx;
    this.config = config;
    this.terrain = terrain;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);
  }

  renderScene(tanks: Tank[], bullets: Bullet[], activeTankIndex: number): void {
    this.clear();
    this.terrain.render(this.ctx);
    tanks.forEach((tank, i) => this.renderTank(tank, i === activeTankIndex));
    bullets.forEach((bullet) => this.renderBullet(bullet));
    this.renderHUD(tanks);
    this.renderAimReticle(tanks[activeTankIndex]);
  }

  private renderTank(tank: Tank, isActive: boolean): void {
    if (!tank.alive) return;

    const ctx = this.ctx;
    const { x, y } = tank.position;
    const halfW = this.config.tankWidth / 2;
    const halfH = this.config.tankHeight / 2;

    // Tank body
    const bodyColor = tank.side_ === PlayerSide.Left ? '#2563EB' : '#DC2626';
    ctx.fillStyle = bodyColor;
    ctx.fillRect(x - halfW, y - halfH, this.config.tankWidth, this.config.tankHeight);

    // Tank body top (rounded shape)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.ellipse(x, y - halfH, halfW * 0.6, halfH * 0.7, 0, Math.PI, 0);
    ctx.fill();

    // Turret
    const turretEnd = tank.getTurretEnd();
    ctx.strokeStyle = isActive ? '#FFD700' : '#333';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y - halfH);
    ctx.lineTo(turretEnd.x, turretEnd.y);
    ctx.stroke();

    // Turret pivot
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x, y - halfH, 5, 0, Math.PI * 2);
    ctx.fill();

    // Treads
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(x - halfW - 2, y + halfH - 6, this.config.tankWidth + 4, 6);

    // Active indicator
    if (isActive) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(x, y - halfH - 25);
      ctx.lineTo(x - 6, y - halfH - 15);
      ctx.lineTo(x + 6, y - halfH - 15);
      ctx.closePath();
      ctx.fill();
    }
  }

  private renderAimReticle(tank: Tank): void {
    if (!tank.alive) return;

    const ctx = this.ctx;
    const turretEnd = tank.getTurretEnd();
    const velocity = tank.getFireVelocity();

    // Draw trajectory preview dots
    const dt = 0.04;
    let px = turretEnd.x;
    let py = turretEnd.y;
    let vx = velocity.x;
    let vy = velocity.y;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    for (let i = 0; i < 40; i++) {
      vy += this.config.gravity * dt;
      px += vx * dt;
      py += vy * dt;

      if (py > this.terrain.getHeightAt(px) || px < 0 || px > this.config.canvasWidth) break;

      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Power bar
    const barX = tank.side_ === PlayerSide.Left ? 20 : this.config.canvasWidth - 120;
    const barY = this.config.canvasHeight - 30;
    const barWidth = 100;
    const barHeight = 12;
    const powerRatio = (tank.power - this.config.minPower) / (this.config.maxPower - this.config.minPower);

    ctx.fillStyle = '#333';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    const powerGradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    powerGradient.addColorStop(0, '#00FF00');
    powerGradient.addColorStop(0.5, '#FFFF00');
    powerGradient.addColorStop(1, '#FF0000');
    ctx.fillStyle = powerGradient;
    ctx.fillRect(barX, barY, barWidth * powerRatio, barHeight);

    ctx.strokeStyle = '#FFF';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    ctx.fillStyle = '#FFF';
    ctx.font = '10px monospace';
    ctx.fillText('POWER', barX, barY - 3);
  }

  private renderBullet(bullet: Bullet): void {
    if (!bullet.active) return;

    const ctx = this.ctx;
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(bullet.position.x, bullet.position.y, 4, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect
    ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(bullet.position.x, bullet.position.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderHUD(tanks: Tank[]): void {
    const ctx = this.ctx;

    tanks.forEach((tank, i) => {
      const hudX = i === 0 ? 20 : this.config.canvasWidth - 220;
      const label = i === 0 ? 'PLAYER 1' : 'PLAYER 2';
      const color = tank.side_ === PlayerSide.Left ? '#2563EB' : '#DC2626';

      // Label
      ctx.fillStyle = color;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(label, hudX, 25);

      // Health bar background
      ctx.fillStyle = '#333';
      ctx.fillRect(hudX, 30, 200, 16);

      // Health bar fill
      const healthRatio = tank.health / this.config.tankHealth;
      const healthColor = healthRatio > 0.5 ? '#22C55E' : healthRatio > 0.25 ? '#EAB308' : '#EF4444';
      ctx.fillStyle = healthColor;
      ctx.fillRect(hudX, 30, 200 * healthRatio, 16);

      // Health bar border
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(hudX, 30, 200, 16);

      // Health text
      ctx.fillStyle = '#FFF';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${tank.health}`, hudX + 100, 43);
      ctx.textAlign = 'start';

      // Angle display
      const angleDeg = Math.round((tank.angle * 180) / Math.PI);
      ctx.fillStyle = '#FFF';
      ctx.font = '11px monospace';
      ctx.fillText(`Angle: ${angleDeg}°`, hudX, 65);
    });
  }

  renderGameOver(winnerIndex: number): void {
    const ctx = this.ctx;

    // Overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, this.config.canvasWidth, this.config.canvasHeight);

    // Winner text
    const label = winnerIndex === 0 ? 'PLAYER 1' : 'PLAYER 2';
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} WINS!`, this.config.canvasWidth / 2, this.config.canvasHeight / 2 - 20);

    // Restart hint
    ctx.fillStyle = '#FFF';
    ctx.font = '18px monospace';
    ctx.fillText('Press R to restart', this.config.canvasWidth / 2, this.config.canvasHeight / 2 + 30);
    ctx.textAlign = 'start';
  }
}
