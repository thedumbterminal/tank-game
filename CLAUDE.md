# CLAUDE.md — Tank Game

## Project Overview

A browser-based 2-player tank combat game (1 human vs 1 AI bot), built with TypeScript and Vite. Turn-based side-scrolling combat with procedurally generated terrain, fuel management, and 3 distinct tank types.

Deployed to GitHub Pages at `/tank-game/`. Developed using the BMAD Game Dev Studio methodology with iterative AI-assisted development.

## Commands

```bash
nvm use                 # Switch to Node 24 LTS (required)
npm install             # Install dependencies
npm run dev             # Start dev server at http://localhost:8080/ (network-accessible)
npm run build           # TypeScript compile + Vite bundle → dist/
npm run test            # Run all tests (vitest)
npm run preview         # Preview production build locally
```

## Architecture

### Source Files (`src/`)

| File | Purpose |
|------|---------|
| [index.ts](src/index.ts) | Entry point — instantiates Game |
| [types.ts](src/types.ts) | All interfaces, enums, and `GAME_CONFIG` constants |
| [Game.ts](src/Game.ts) | Main orchestrator — game loop, state machine, collision, turn management |
| [Renderer.ts](src/Renderer.ts) | Canvas 2D rendering — tanks, terrain, HUD, screens |
| [Tank.ts](src/Tank.ts) | Tank entity — position, health, fuel, angle, power, fire cooldown |
| [Bullet.ts](src/Bullet.ts) | Projectile physics — gravity simulation, terrain collision |
| [Terrain.ts](src/Terrain.ts) | Procedural terrain — sine-wave height map, craters |
| [InputHandler.ts](src/InputHandler.ts) | Keyboard + touch input — just-pressed vs held, 8-button touch overlay |
| [BotController.ts](src/BotController.ts) | AI opponent — projectile motion targeting, adaptive jitter |

### Game State Machine

```
TankSelect → Playing → GameOver
```

- **TankSelect:** Player picks a tank type; bot is randomly assigned
- **Playing:** Turn-based — player moves/aims/fires, then bot takes its turn
- **GameOver:** Winner displayed; press R to restart

### Tank Types (defined in `types.ts`)

| Tank | Bullets/Shot | Damage | Velocity | Special |
|------|-------------|--------|----------|---------|
| M48 GAU-AVENGER | 10 | 5 each | 1.3x | Sequential burst (80ms delay) |
| ABRAMS | 1 | 35 | 1.0x | Standard |
| MAUS | 1 | 50 | 0.9x | Fires every 2 turns; large craters (30px) |

### Physics Constants (in `GAME_CONFIG`)

- Gravity: 400 px/s²
- Fuel cost: 0.5 per unit distance moved
- Crater size: 15px (standard) / 30px (MAUS)
- Arc reticle radius: 150px from tank

## Key Design Decisions

- **Module system:** ES Modules (`"type": "module"` in package.json)
- **Build target:** ES2020, TypeScript strict mode enabled
- **Vite base path:** `/tank-game/` for production, `/` for dev — controlled by `vite.config.ts`
- **Canvas scaling:** Maintains 16:9 aspect ratio across desktop, tablet, and phone
- **Touch support:** 8-button virtual overlay; auto-detected; multi-touch per button tracked independently
- **Movement lock:** After firing, tank cannot move for the remainder of that turn
- **Terrain slope:** Tanks snap to terrain height and rotate to match slope angle
- **Bot AI:** Uses projectile motion equations with angle jitter (< 0.15 rad threshold to fire)

## Testing

Tests live alongside source files (`*.test.ts`). Run with `npm run test`.

```
Tank.test.ts         — movement, fuel, health, angle/power clamping
Terrain.test.ts      — height map generation, crater creation
Bullet.test.ts       — physics, collision detection
BotController.test.ts — targeting, fire decision logic
InputHandler.test.ts — keyboard/touch state tracking
types.test.ts        — config and enum validation
regression.test.ts   — MAUS fire cooldown and other regression cases
```

Target: maintain full coverage on all core mechanics. Add a regression test for any bug fixed.

## Development Workflow

1. Check [input/requirements.md](input/requirements.md) for feature specs
2. Use the BMAD game-dev agent for structured feature work: `/bmad-agent-gds-game-dev`
3. Bump `package.json` version on each feature addition
4. Update [CHANGELOG.md](CHANGELOG.md) following Common Changelog format
5. Run `npm run test` before committing
6. Run `npm run build` to verify production build succeeds

## Deployment

- **GitHub Pages:** Push to `main` triggers CI to build and deploy to `https://<user>.github.io/tank-game/`
- **CI config:** `.github/` directory
- **Production base path:** Hardcoded as `/tank-game/` in `vite.config.ts`

## Node Version

Node 24 LTS (Krypton) — specified in `.nvmrc`. Always run `nvm use` before installing or running the project.
