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
  tankFuel: number; // Starting fuel for each tank
  turretLength: number;
  minAngle: number;
  maxAngle: number;
  minPower: number;
  maxPower: number;
}

export enum GameState {
  MainMenu = 'mainmenu',
  TankSelect = 'tankselect',
  Playing = 'playing',
  LevelComplete = 'levelcomplete',
  NameEntry = 'nameentry',
  Leaderboard = 'leaderboard',
  GameOver = 'gameover',
}

export interface LevelConfig {
  level: number;
  botJitter: number;
  botActionInterval: number;
  botAngleThreshold: number;
  botPowerThreshold: number;
  botHealthMultiplier: number;
}

export interface LeaderboardEntry {
  name: string;
  level: number;
  date: string;
}

export interface SaveData {
  lastCompletedLevel: number;
  leaderboard: LeaderboardEntry[];
}

export enum TankTypeName {
  GauAvenger = 'M48 GAU-AVENGER',
  Abrams = 'ABRAMS',
  Maus = 'MAUS',
}

export interface TankTypeConfig {
  name: TankTypeName;
  description: string;
  damage: number;
  bulletsPerShot: number;
  fireCooldownTurns: number;
  bulletSpread: number; // radians of spread for multi-bullet
  bulletVelocityMultiplier: number;
  bulletFireDelay: number; // seconds between sequential bullets (0 = all at once)
  craterRadius: number; // radius of crater created by bullets
  color: string;
}

export const TANK_TYPES: Record<TankTypeName, TankTypeConfig> = {
  [TankTypeName.GauAvenger]: {
    name: TankTypeName.GauAvenger,
    description: '10 bullets per shot, 5 dmg each',
    damage: 5,
    bulletsPerShot: 10,
    fireCooldownTurns: 1,
    bulletSpread: 0.15,
    bulletVelocityMultiplier: 1.3,
    bulletFireDelay: 0.08, // 80ms between each bullet
    craterRadius: 15,
    color: '#2563EB',
  },
  [TankTypeName.Abrams]: {
    name: TankTypeName.Abrams,
    description: '1 bullet per shot, 35 dmg',
    damage: 35,
    bulletsPerShot: 1,
    fireCooldownTurns: 1,
    bulletSpread: 0,
    bulletVelocityMultiplier: 1.0,
    bulletFireDelay: 0,
    craterRadius: 15,
    color: '#16A34A',
  },
  [TankTypeName.Maus]: {
    name: TankTypeName.Maus,
    description: '1 bullet per shot, 50 dmg, fires every 2 turns, larger crater',
    damage: 50,
    bulletsPerShot: 1,
    fireCooldownTurns: 2,
    bulletSpread: 0,
    bulletVelocityMultiplier: 0.9,
    bulletFireDelay: 0,
    craterRadius: 30, // MAUS causes larger craters
    color: '#7C3AED',
  },
};

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
  tankFuel: 100, // Starting fuel
  turretLength: 35,
  minAngle: 0,
  maxAngle: Math.PI,
  minPower: 100,
  maxPower: 600,
};
