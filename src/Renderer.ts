import { GameConfig, PlayerSide, TankTypeName, TANK_TYPES, LeaderboardEntry } from './types';
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

  renderScene(tanks: Tank[], bullets: Bullet[], activeTankIndex: number, currentLevel: number = 1): void {
    this.clear();
    this.terrain.render(this.ctx);
    tanks.forEach((tank, i) => this.renderTank(tank, i === activeTankIndex));
    bullets.forEach((bullet) => this.renderBullet(bullet));
    this.renderHUD(tanks, currentLevel);
    this.renderAimReticle(tanks[activeTankIndex]);
  }

  /**
   * Draws a realistic side-profile tank at a given position and scale.
   * Used by both in-game rendering and the tank selection screen.
   */
  private drawTankBody(
    cx: number, cy: number, scale: number,
    color: string, turretAngle: number, isActive: boolean
  ): void {
    const ctx = this.ctx;
    const s = scale;

    // Darken/lighten helper
    const darker = (hex: string, amount: number) => {
      const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
      const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
      const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
      return `rgb(${r},${g},${b})`;
    };

    // --- TRACK ASSEMBLY ---
    const trackY = cy + 8 * s;
    const trackW = 32 * s;
    const trackH = 10 * s;

    // Track outer shell
    ctx.fillStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.roundRect(cx - trackW, trackY - trackH / 2, trackW * 2, trackH, 5 * s);
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Track links (small rectangles along bottom)
    ctx.fillStyle = '#3a3a3a';
    for (let i = -5; i <= 5; i++) {
      const lx = cx + i * 5.5 * s;
      ctx.fillRect(lx - 2 * s, trackY + trackH / 2 - 2.5 * s, 4 * s, 2.5 * s);
    }

    // Road wheels
    const wheelCount = 5;
    const wheelSpacing = (trackW * 1.6) / (wheelCount - 1);
    const wheelStartX = cx - trackW * 0.8;
    for (let i = 0; i < wheelCount; i++) {
      const wx = wheelStartX + i * wheelSpacing;
      // Outer wheel
      ctx.fillStyle = '#444';
      ctx.beginPath();
      ctx.arc(wx, trackY, 4 * s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      ctx.stroke();
      // Hub
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(wx, trackY, 1.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }

    // Drive sprocket (rear, larger)
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(cx + trackW - 2 * s, trackY - 1 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a';
    ctx.stroke();

    // Idler wheel (front, larger)
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    ctx.arc(cx - trackW + 2 * s, trackY - 1 * s, 5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2a2a2a';
    ctx.stroke();

    // --- HULL ---
    const hullTop = cy - 4 * s;
    const hullBot = trackY - trackH / 2 + 1 * s;
    const hullH = hullBot - hullTop;

    // Main hull body (trapezoidal for sloped armor)
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx - 28 * s, hullBot);          // rear bottom
    ctx.lineTo(cx - 26 * s, hullTop);           // rear top
    ctx.lineTo(cx + 22 * s, hullTop);           // front top
    ctx.lineTo(cx + 30 * s, hullBot - 2 * s);   // front slope
    ctx.lineTo(cx + 28 * s, hullBot);           // front bottom
    ctx.closePath();
    ctx.fill();

    // Hull front slope highlight
    ctx.fillStyle = darker(color, -30);
    ctx.beginPath();
    ctx.moveTo(cx + 22 * s, hullTop);
    ctx.lineTo(cx + 30 * s, hullBot - 2 * s);
    ctx.lineTo(cx + 28 * s, hullBot);
    ctx.lineTo(cx + 22 * s, hullBot);
    ctx.closePath();
    ctx.fill();

    // Hull panel line
    ctx.strokeStyle = darker(color, 40);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - 24 * s, hullTop + hullH * 0.5);
    ctx.lineTo(cx + 24 * s, hullTop + hullH * 0.5);
    ctx.stroke();

    // Rear engine deck detail
    ctx.fillStyle = darker(color, 30);
    ctx.fillRect(cx - 28 * s, hullTop + 1 * s, 8 * s, hullH - 3 * s);

    // --- TURRET ---
    const turretCx = cx + 2 * s;
    const turretTop = hullTop - 8 * s;
    const turretW = 16 * s;
    const turretH = 8 * s;

    // Turret base (rounded rectangle)
    ctx.fillStyle = darker(color, 15);
    ctx.beginPath();
    ctx.roundRect(turretCx - turretW, turretTop, turretW * 2, turretH, [4 * s, 4 * s, 2 * s, 2 * s]);
    ctx.fill();

    // Turret top highlight
    ctx.fillStyle = darker(color, -10);
    ctx.beginPath();
    ctx.roundRect(turretCx - turretW + 2 * s, turretTop + 1 * s, turretW * 2 - 4 * s, 3 * s, 2 * s);
    ctx.fill();

    // Commander's cupola
    ctx.fillStyle = darker(color, 25);
    ctx.beginPath();
    ctx.arc(turretCx - 8 * s, turretTop + 1 * s, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // --- GUN BARREL ---
    const barrelOriginX = turretCx;
    const barrelOriginY = turretTop + turretH * 0.4;
    const barrelLength = this.config.turretLength;
    const barrelEndX = barrelOriginX + Math.cos(turretAngle) * barrelLength;
    const barrelEndY = barrelOriginY - Math.sin(turretAngle) * barrelLength;

    // Barrel shadow
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 6 * s;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(barrelOriginX, barrelOriginY + 1);
    ctx.lineTo(barrelEndX, barrelEndY + 1);
    ctx.stroke();

    // Main barrel
    ctx.strokeStyle = isActive ? '#FFD700' : '#555';
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(barrelOriginX, barrelOriginY);
    ctx.lineTo(barrelEndX, barrelEndY);
    ctx.stroke();

    // Muzzle brake
    const muzzleX = barrelEndX;
    const muzzleY = barrelEndY;
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, 3.5 * s, 0, Math.PI * 2);
    ctx.fill();

    // Mantlet (where barrel meets turret)
    ctx.fillStyle = darker(color, 30);
    ctx.beginPath();
    ctx.arc(barrelOriginX + 2 * s, barrelOriginY, 4 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  private renderTank(tank: Tank, isActive: boolean): void {
    if (!tank.alive) return;

    const ctx = this.ctx;
    const { x, y } = tank.position;
    const halfH = this.config.tankHeight / 2;

    this.drawTankBody(x, y, 1, tank.tankType.color, tank.angle, isActive);

    // Active indicator
    if (isActive) {
      ctx.fillStyle = '#FFD700';
      ctx.beginPath();
      ctx.moveTo(x, y - halfH - 30);
      ctx.lineTo(x - 6, y - halfH - 20);
      ctx.lineTo(x + 6, y - halfH - 20);
      ctx.closePath();
      ctx.fill();
    }

    // Tank type label under the tank
    ctx.fillStyle = '#FFF';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(tank.tankType.name, x, y + halfH + 22);
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

  private renderHUD(tanks: Tank[], currentLevel: number = 1): void {
    const ctx = this.ctx;

    // Level indicator — centre top
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${currentLevel}`, this.config.canvasWidth / 2, 25);
    ctx.textAlign = 'start';

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

      // Tank preview (realistic)
      const previewX = cardX + cardWidth / 2;
      const previewY = cardY + 65;
      this.drawTankBody(previewX, previewY, 1.1, typeConfig.color, Math.PI / 6, false);

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

    // Controls hint - show tap instructions if touch-capable, keyboard otherwise
    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    if (hasTouch && !hasPointer) {
      ctx.fillText('Tap a tank to select  |  Tap again to confirm', canvasWidth / 2, canvasHeight - 40);
    } else if (hasTouch && hasPointer) {
      ctx.fillText('Tap or A/D to select  |  Tap again or Enter to confirm', canvasWidth / 2, canvasHeight - 40);
    } else {
      ctx.fillText('A/D or Arrow Keys to select  |  Space/Enter to confirm', canvasWidth / 2, canvasHeight - 40);
    }
    ctx.textAlign = 'start';
  }

  renderGameOver(_winnerIndex: number): void {
    // Legacy — now redirects to leaderboard display. Kept for API compatibility.
    this.renderLeaderboard([], false);
  }

  renderMainMenu(options: string[], selectedIndex: number, hasSave: boolean, continueLevel: number): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.config;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 52px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('TANK GAME', canvasWidth / 2, canvasHeight / 2 - 120);

    if (hasSave) {
      ctx.fillStyle = '#888';
      ctx.font = '14px monospace';
      ctx.fillText(`Continue from Level ${continueLevel}`, canvasWidth / 2, canvasHeight / 2 - 80);
    }

    const itemH = 60;
    const startY = canvasHeight / 2 - (options.length * itemH) / 2;

    options.forEach((option, i) => {
      const itemY = startY + i * itemH;
      const isSelected = i === selectedIndex;

      ctx.fillStyle = isSelected ? '#FFD700' : '#AAA';
      ctx.font = isSelected ? 'bold 28px monospace' : '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(isSelected ? `▶ ${option}` : option, canvasWidth / 2, itemY + 36);
    });

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const hasPointer = window.matchMedia('(pointer: fine)').matches;
    ctx.fillStyle = '#555';
    ctx.font = '13px monospace';
    ctx.textAlign = 'center';
    if (hasTouch && !hasPointer) {
      ctx.fillText('Tap to select', canvasWidth / 2, canvasHeight - 30);
    } else {
      ctx.fillText('W/S or Arrow Keys to navigate  |  Space/Enter to select', canvasWidth / 2, canvasHeight - 30);
    }
    ctx.textAlign = 'start';
  }

  renderLevelComplete(level: number): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.config;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`LEVEL ${level} COMPLETE!`, canvasWidth / 2, canvasHeight / 2 - 30);

    ctx.fillStyle = '#4ADE80';
    ctx.font = '22px monospace';
    ctx.fillText(`Advancing to Level ${level + 1}`, canvasWidth / 2, canvasHeight / 2 + 20);

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    ctx.fillStyle = '#FFF';
    ctx.font = '16px monospace';
    if (hasTouch) {
      ctx.fillText('Tap or press Space/Enter to continue', canvasWidth / 2, canvasHeight / 2 + 70);
    } else {
      ctx.fillText('Press Space or Enter to continue', canvasWidth / 2, canvasHeight / 2 + 70);
    }
    ctx.textAlign = 'start';
  }

  renderNameEntryPrompt(): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.config;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#EF4444';
    ctx.font = 'bold 40px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEATED!', canvasWidth / 2, canvasHeight / 2 - 60);

    ctx.fillStyle = '#FFF';
    ctx.font = '20px monospace';
    ctx.fillText('Enter your name for the leaderboard:', canvasWidth / 2, canvasHeight / 2 - 10);

    ctx.fillStyle = '#888';
    ctx.font = '14px monospace';
    ctx.fillText('(type and press Enter)', canvasWidth / 2, canvasHeight / 2 + 60);

    ctx.textAlign = 'start';
  }

  renderLeaderboard(entries: LeaderboardEntry[], fromMainMenu: boolean): void {
    const ctx = this.ctx;
    const { canvasWidth, canvasHeight } = this.config;

    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEADERBOARD', canvasWidth / 2, 60);

    if (entries.length === 0) {
      ctx.fillStyle = '#555';
      ctx.font = '18px monospace';
      ctx.fillText('No entries yet — play to get on the board!', canvasWidth / 2, canvasHeight / 2);
    } else {
      const tableW = 500;
      const tableX = (canvasWidth - tableW) / 2;
      const rowH = 32;
      const startY = 100;

      // Header
      ctx.fillStyle = '#333';
      ctx.fillRect(tableX, startY, tableW, rowH);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 13px monospace';
      ctx.textAlign = 'left';
      ctx.fillText('#', tableX + 10, startY + 21);
      ctx.fillText('NAME', tableX + 40, startY + 21);
      ctx.textAlign = 'right';
      ctx.fillText('LEVEL', tableX + tableW - 10, startY + 21);
      ctx.textAlign = 'start';

      entries.slice(0, 10).forEach((entry, i) => {
        const ry = startY + rowH + i * rowH;

        ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'transparent';
        ctx.fillRect(tableX, ry, tableW, rowH);

        const rankColor = i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : '#AAA';
        ctx.fillStyle = rankColor;
        ctx.font = i < 3 ? 'bold 13px monospace' : '13px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}`, tableX + 10, ry + 21);
        ctx.fillText(entry.name.slice(0, 16), tableX + 40, ry + 21);
        ctx.textAlign = 'right';
        ctx.fillText(`${entry.level}`, tableX + tableW - 10, ry + 21);
        ctx.textAlign = 'start';

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tableX, ry + rowH);
        ctx.lineTo(tableX + tableW, ry + rowH);
        ctx.stroke();
      });
    }

    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    ctx.fillStyle = '#555';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    if (hasTouch) {
      ctx.fillText(fromMainMenu ? 'Tap to return' : 'Tap to return to menu', canvasWidth / 2, canvasHeight - 30);
    } else {
      ctx.fillText('Press R to return to menu', canvasWidth / 2, canvasHeight - 30);
    }
    ctx.textAlign = 'start';
  }
}
