import { GameConfig } from './types';

export class Terrain {
  private readonly config: GameConfig;
  private readonly heightMap: number[];

  constructor(config: GameConfig) {
    this.config = config;
    this.heightMap = this.generateHeightMap();
  }

  private generateHeightMap(): number[] {
    const { canvasWidth, groundLevel } = this.config;
    const heights: number[] = new Array(canvasWidth);

    // Layer multiple sine waves for natural terrain
    const layers = [
      { frequency: 0.005, amplitude: 40, phase: Math.random() * Math.PI * 2 },
      { frequency: 0.012, amplitude: 25, phase: Math.random() * Math.PI * 2 },
      { frequency: 0.025, amplitude: 15, phase: Math.random() * Math.PI * 2 },
      { frequency: 0.06, amplitude: 8, phase: Math.random() * Math.PI * 2 },
    ];

    // Add 1-3 trenches at random positions
    const trenchCount = 1 + Math.floor(Math.random() * 3);
    const trenches: { center: number; width: number; depth: number }[] = [];
    for (let t = 0; t < trenchCount; t++) {
      trenches.push({
        center: canvasWidth * 0.2 + Math.random() * canvasWidth * 0.6,
        width: 40 + Math.random() * 60,
        depth: 20 + Math.random() * 30,
      });
    }

    for (let x = 0; x < canvasWidth; x++) {
      let height = groundLevel;

      // Apply sine wave layers
      for (const layer of layers) {
        height -= Math.sin(x * layer.frequency + layer.phase) * layer.amplitude;
      }

      // Apply trenches (gaussian dip)
      for (const trench of trenches) {
        const dist = x - trench.center;
        const gaussian = Math.exp(-(dist * dist) / (2 * (trench.width / 3) * (trench.width / 3)));
        height += gaussian * trench.depth;
      }

      // Keep terrain within reasonable bounds
      const minHeight = this.config.canvasHeight * 0.4;
      const maxHeight = this.config.canvasHeight * 0.9;
      heights[x] = Math.max(minHeight, Math.min(maxHeight, height));
    }

    return heights;
  }

  getHeightAt(x: number): number {
    const ix = Math.max(0, Math.min(this.heightMap.length - 1, Math.round(x)));
    return this.heightMap[ix];
  }

  createCrater(centerX: number, radius: number = 15, depth: number = 12): void {
    const startX = Math.max(0, Math.floor(centerX - radius));
    const endX = Math.min(this.heightMap.length - 1, Math.ceil(centerX + radius));

    for (let x = startX; x <= endX; x++) {
      const dist = Math.abs(x - centerX);
      if (dist <= radius) {
        // Parabolic crater shape
        const craterDepth = depth * (1 - (dist / radius) ** 2);
        this.heightMap[x] += craterDepth;

        // Clamp to canvas bounds
        this.heightMap[x] = Math.min(this.heightMap[x], this.config.canvasHeight - 5);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const { canvasWidth, canvasHeight } = this.config;

    // Sky gradient
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight * 0.6);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F0FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Terrain surface
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight);
    for (let x = 0; x < canvasWidth; x++) {
      ctx.lineTo(x, this.heightMap[x]);
    }
    ctx.lineTo(canvasWidth, canvasHeight);
    ctx.closePath();

    const groundGradient = ctx.createLinearGradient(0, canvasHeight * 0.4, 0, canvasHeight);
    groundGradient.addColorStop(0, '#4A7C2E');
    groundGradient.addColorStop(0.4, '#3D6B25');
    groundGradient.addColorStop(1, '#2E5218');
    ctx.fillStyle = groundGradient;
    ctx.fill();

    // Terrain edge line
    ctx.beginPath();
    ctx.moveTo(0, this.heightMap[0]);
    for (let x = 1; x < canvasWidth; x++) {
      ctx.lineTo(x, this.heightMap[x]);
    }
    ctx.strokeStyle = '#2E5218';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}
