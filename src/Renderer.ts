import { GameConfig, PlayerSide, TankTypeName, TANK_TYPES } from './types';
import { Tank } from './Tank';
import { Bullet } from './Bullet';
import { Terrain } from './Terrain';

const RETICLE_MAX_DISTANCE = 150; // Max pixels from tank before reticle stops

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

    // Tank body - use tank type color
    const bodyColor = tank.tankType.color;
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

    // Tank type label under the tank
    ctx.fillStyle = '#FFF';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tank.tankType.name, x, y + halfH + 16);
    ctx.textAlign = 'start';
  }

  private renderAimReticle(tank: Tank): void {
    if (!tank.alive) return;

    const ctx = this.ctx;
    const turretEnd = tank.getTurretEnd();
    const velocity = tank.getFireVelocity();

    // Draw trajectory preview dots - BLACK for visibility, limited range
    const dt = 0.04;
    let px = turretEnd.x;
    let py = turretEnd.y;
    let vx = velocity.x;
    let vy = velocity.y;

    ctx.fillStyle = '#000';
    for (let i = 0; i < 40; i++) {
      vy += this.config.gravity * dt;
      px += vx * dt;
      py += vy * dt;

      // Limit reticle to close range from tank
      const distFromTank = Math.sqrt(
        (px - tank.position.x) ** 2 + (py - tank.position.y) ** 2
      );
      if (distFromTank > RETICLE_MAX_DISTANCE) break;

      if (py > this.terrain.getHeightAt(px) || px < 0 || px > this.config.canvasWidth) break;

      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Power bar
    const barX = tank.side === PlayerSide.Left ? 20 : this.config.canvasWidth - 120;
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

    // Show cooldown status if applicable
    if (!tank.canFire) {
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('RELOADING...', tank.position.x, tank.position.y - 50);
      ctx.textAlign = 'start';
    }
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
      const color = tank.tankType.color;

      // Label
      ctx.fillStyle = color;
      ctx.font = 'bold 14px monospace';
      ctx.fillText(`${label} (${tank.tankType.name})`, hudX, 25);

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

      // Fuel gauge
      const fuelBarY = 75;
      const fuelBarWidth = 200;
      const fuelBarHeight = 12;
      const fuelRatio = tank.fuel / tank.maxFuel;

      // Background
      ctx.fillStyle = '#333';
      ctx.fillRect(hudX, fuelBarY, fuelBarWidth, fuelBarHeight);

      // Fill - transitions from cyan to orange to red as fuel depletes
      const fuelColor = fuelRatio > 0.5 ? '#06B6D4' : fuelRatio > 0.2 ? '#F59E0B' : '#EF4444';
      ctx.fillStyle = fuelColor;
      ctx.fillRect(hudX, fuelBarY, fuelBarWidth * fuelRatio, fuelBarHeight);

      // Border
      ctx.strokeStyle = '#FFF';
      ctx.lineWidth = 1;
      ctx.strokeRect(hudX, fuelBarY, fuelBarWidth, fuelBarHeight);

      // Label
      ctx.fillStyle = '#FFF';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`FUEL ${Math.round(tank.fuel)}`, hudX + fuelBarWidth / 2, fuelBarY + 10);
      ctx.textAlign = 'start';
    });
  }

  renderTankSelect(tankTypes: TankTypeName[], selectedIndex: number): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.config;

    // Background
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SELECT YOUR TANK', canvasWidth / 2, 80);

    // Tank options
    const cardWidth = 240;
    const cardHeight = 270;
    const gap = 40;
    const totalWidth = tankTypes.length * cardWidth + (tankTypes.length - 1) * gap;
    const startX = (canvasWidth - totalWidth) / 2;

    tankTypes.forEach((typeName, i) => {
      const typeConfig = TANK_TYPES[typeName];
      const cardX = startX + i * (cardWidth + gap);
      const cardY = 120;
      const isSelected = i === selectedIndex;

      // Card background
      ctx.fillStyle = isSelected ? '#333' : '#1a1a1a';
      ctx.fillRect(cardX, cardY, cardWidth, cardHeight);

      // Selection border
      if (isSelected) {
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
      } else {
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
      }

      // Tank preview (simple rectangle representation)
      const previewX = cardX + cardWidth / 2;
      const previewY = cardY + 60;
      ctx.fillStyle = typeConfig.color;
      ctx.fillRect(previewX - 30, previewY - 15, 60, 30);
      ctx.beginPath();
      ctx.ellipse(previewX, previewY - 15, 18, 10, 0, Math.PI, 0);
      ctx.fill();

      // Turret
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(previewX, previewY - 15);
      ctx.lineTo(previewX + 25, previewY - 30);
      ctx.stroke();

      // Treads
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(previewX - 32, previewY + 9, 64, 6);

      // Tank name
      ctx.fillStyle = typeConfig.color;
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(typeConfig.name, cardX + cardWidth / 2, cardY + 110);

      // Stats table
      const tableX = cardX + 12;
      const tableW = cardWidth - 24;
      const tableY = cardY + 125;
      const rowH = 18;
      const labelX = tableX + 6;
      const valueX = tableX + tableW - 6;

      // Table header
      ctx.fillStyle = '#555';
      ctx.fillRect(tableX, tableY, tableW, rowH);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('STAT', labelX, tableY + 13);
      ctx.textAlign = 'right';
      ctx.fillText('VALUE', valueX, tableY + 13);

      // Table rows
      const rows: { label: string; value: string; color?: string }[] = [
        { label: 'Damage', value: `${typeConfig.damage}` },
        { label: 'Bullets/Shot', value: `${typeConfig.bulletsPerShot}` },
        {
          label: 'Fire Rate',
          value: typeConfig.fireCooldownTurns > 1 ? `Every ${typeConfig.fireCooldownTurns} turns` : 'Every turn',
          color: typeConfig.fireCooldownTurns > 1 ? '#FF6B6B' : undefined,
        },
        {
          label: 'Velocity',
          value: typeConfig.bulletVelocityMultiplier > 1 ? 'High' : typeConfig.bulletVelocityMultiplier < 1 ? 'Low' : 'Normal',
          color: typeConfig.bulletVelocityMultiplier > 1 ? '#4ADE80' : typeConfig.bulletVelocityMultiplier < 1 ? '#FCA5A5' : undefined,
        },
        {
          label: 'Crater Size',
          value: typeConfig.craterRadius > 15 ? 'Large' : 'Normal',
          color: typeConfig.craterRadius > 15 ? '#F59E0B' : undefined,
        },
      ];

      rows.forEach((row, ri) => {
        const ry = tableY + rowH + ri * rowH;

        // Alternating row background
        if (ri % 2 === 0) {
          ctx.fillStyle = 'rgba(255,255,255,0.03)';
          ctx.fillRect(tableX, ry, tableW, rowH);
        }

        // Row divider
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tableX, ry);
        ctx.lineTo(tableX + tableW, ry);
        ctx.stroke();

        // Label
        ctx.fillStyle = '#AAA';
        ctx.font = '10px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(row.label, labelX, ry + 13);

        // Value
        ctx.fillStyle = row.color || '#FFF';
        ctx.textAlign = 'right';
        ctx.fillText(row.value, valueX, ry + 13);
      });

      // Table border
      const tableH = rowH + rows.length * rowH;
      ctx.strokeStyle = '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(tableX, tableY, tableW, tableH);
    });

    // Controls hint
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A/D or Arrow Keys to select  |  Space/Enter to confirm', canvasWidth / 2, canvasHeight - 40);
    ctx.textAlign = 'start';
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
