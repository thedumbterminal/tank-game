export interface Vector2 {
  x: number;
  y: number;
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  groundLevel: number;
  gravity: number;
  tankSpeed: number;
  bulletSpeed: number;
  tankWidth: number;
  tankHeight: number;
  tankHealth: number;
  turretLength: number;
  minAngle: number;
  maxAngle: number;
  minPower: number;
  maxPower: number;
}

export enum GameState {
  Playing = 'playing',
  GameOver = 'gameover',
}

export enum PlayerSide {
  Left = 'left',
  Right = 'right',
}

export const DEFAULT_CONFIG: GameConfig = {
  canvasWidth: 1024,
  canvasHeight: 576,
  groundLevel: 480,
  gravity: 400,
  tankSpeed: 120,
  bulletSpeed: 500,
  tankWidth: 60,
  tankHeight: 30,
  tankHealth: 100,
  turretLength: 35,
  minAngle: 0,
  maxAngle: Math.PI,
  minPower: 100,
  maxPower: 600,
};
