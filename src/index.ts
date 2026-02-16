import { Game } from './Game';
import { DEFAULT_CONFIG } from './types';

const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
if (!canvas) {
  throw new Error('Canvas element not found');
}

const game = new Game(canvas);
game.start();

// Responsive canvas scaling - CSS transform to fit viewport while keeping internal 1024x576
function resizeCanvas(): void {
  const maxW = window.innerWidth;
  const maxH = window.innerHeight;
  const scaleX = maxW / DEFAULT_CONFIG.canvasWidth;
  const scaleY = maxH / DEFAULT_CONFIG.canvasHeight;
  const scale = Math.min(scaleX, scaleY, 1); // Never scale up beyond native

  canvas.style.width = `${DEFAULT_CONFIG.canvasWidth * scale}px`;
  canvas.style.height = `${DEFAULT_CONFIG.canvasHeight * scale}px`;
}

resizeCanvas();
let resizeTimer: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(resizeCanvas, 100);
});
