# Story 1.1: Level Progression and Leaderboard

Status: review

## Story

As a player,
I want to progress through increasingly difficult levels and see my name on a leaderboard,
so that the game has long-term challenge and replayability beyond a single match.

## Acceptance Criteria

1. **Level progression**: When the player wins a match, they advance to the next numbered level automatically. The level number is displayed in the HUD during gameplay.

2. **Enemy difficulty scaling**: The bot opponent becomes measurably harder each level — reduced aim jitter, faster decision-making, tighter fire threshold, and increased health — following a documented `LevelConfig` formula.

3. **Main menu**: A main menu screen is shown on game start (and after losing) with the options: "New Game", "Continue (Level X)" (only if a save exists), and "Leaderboard".

4. **Persistence — level progress**: The highest level the player has reached is saved to `localStorage` under key `tank_game_save` and restored when the game loads. Starting a "New Game" resets the current level to 1 (does NOT erase the save).

5. **Level complete screen**: After winning a match, a "Level X Complete!" screen is shown before advancing. The player confirms with Space/Enter/tap to proceed to tank selection for the next level.

6. **Game over screen (player loses)**: On losing, the player is prompted to enter their name for the leaderboard. After submitting, the leaderboard is displayed, then they return to the main menu.

7. **Leaderboard**: Top 10 entries (name + level reached) are persisted in `localStorage`, sorted by level descending then by date. The leaderboard screen can be accessed from the main menu.

8. **Name entry UI**: A temporary HTML `<input>` element overlays the canvas for name capture (max 16 characters). On Enter or tap of a "Submit" button, the name is recorded and the element removed.

9. **Touch and keyboard support**: All new screens support both keyboard navigation and touchscreen tap interaction, consistent with the existing pattern in `Renderer.ts` (detect `hasTouch` and render appropriate hints).

10. **Tests**: `LevelManager` and `SaveManager` have unit tests. New `GameState` transitions are covered. No existing tests regress.

11. **Version and changelog**: `package.json` version bumped to `1.13.0`. `CHANGELOG.md` updated per common-changelog.org format.

## Tasks / Subtasks

- [x] Task 1: Add new types and interfaces to `src/types.ts` (AC: 1, 2, 3, 6, 7)
  - [x] 1.1 Add `MainMenu`, `LevelComplete`, `NameEntry`, `Leaderboard` values to `GameState` enum
  - [x] 1.2 Add `LevelConfig` interface: `{ level, botJitter, botActionInterval, botAngleThreshold, botPowerThreshold, botHealthMultiplier }`
  - [x] 1.3 Add `LeaderboardEntry` interface: `{ name: string, level: number, date: string }`
  - [x] 1.4 Add `SaveData` interface: `{ lastCompletedLevel: number, leaderboard: LeaderboardEntry[] }`

- [x] Task 2: Create `src/LevelManager.ts` (AC: 2)
  - [x] 2.1 Implement `getLevelConfig(level: number): LevelConfig` pure function with documented difficulty formula
  - [x] 2.2 Formula: `botJitter = max(0.01, 0.08 - level * 0.007)`, `botActionInterval = max(0.15, 0.5 - level * 0.03)`, `botAngleThreshold = max(0.04, 0.15 - level * 0.01)`, `botPowerThreshold = max(8, 40 - level * 3)`, `botHealthMultiplier = min(3.0, 1.0 + level * 0.1)`
  - [x] 2.3 Export `LevelManager` class with `currentLevel` tracking, `advance()` method, and `reset()` method

- [x] Task 3: Create `src/SaveManager.ts` (AC: 4, 7)
  - [x] 3.1 Implement `load(): SaveData` — reads `localStorage.getItem('tank_game_save')`, returns default `{ lastCompletedLevel: 0, leaderboard: [] }` if absent or parse fails
  - [x] 3.2 Implement `save(data: SaveData): void` — serialises to JSON and writes to `localStorage`
  - [x] 3.3 Implement `addLeaderboardEntry(name: string, level: number): SaveData` — appends entry, sorts by `level` desc then `date` desc, trims to top 10, saves, returns updated data
  - [x] 3.4 Implement `getLastCompletedLevel(): number` — convenience wrapper
  - [x] 3.5 Implement `saveCompletedLevel(level: number): void` — updates `lastCompletedLevel` if new level > stored value, then saves

- [x] Task 4: Update `src/BotController.ts` to accept difficulty (AC: 2)
  - [x] 4.1 Replace hardcoded constants (`0.08`, `0.5`, `0.15`, `40`) with instance fields set from a `LevelConfig` parameter
  - [x] 4.2 Add `setDifficulty(config: LevelConfig): void` method called by `Game` before each match
  - [x] 4.3 The `botHealthMultiplier` is NOT applied in BotController — it is used by `Game.initMatch()` when constructing the bot's `Tank` (pass scaled health to Tank constructor or set `tank.health` after construction)

- [x] Task 5: Update `src/Game.ts` — state machine, level logic, persistence (AC: 1, 3, 4, 5, 6, 9)
  - [x] 5.1 Add `LevelManager` and `SaveManager` instances as private readonly fields
  - [x] 5.2 Add `private currentLevel: number = 1` (driven by `LevelManager`)
  - [x] 5.3 On construction: call `SaveManager.load()` to restore `lastCompletedLevel`
  - [x] 5.4 Add `MainMenu` handling in `update()`: keyboard A/D or arrow keys cycle menu options (selectedMenuIndex), Space/Enter selects; "Leaderboard" option → `GameState.Leaderboard`
  - [x] 5.5 When player wins: transition to `LevelComplete` state, call `saveManager.saveCompletedLevel(currentLevel)`, wait for Space/Enter/tap → call `levelManager.advance()` → go to `TankSelect`
  - [x] 5.6 When player loses (bot is winner): transition to `NameEntry` state; `this.pendingLeaderboardLevel = this.currentLevel` (the level they died on)
  - [x] 5.7 `NameEntry` state: show HTML `<input>` element overlaying canvas; on submit → call `SaveManager.addLeaderboardEntry(name, pendingLeaderboardLevel)` → transition to `GameOver` state
  - [x] 5.8 `GameOver` state (post-name): show leaderboard via renderer; R/tap → `MainMenu`; reset `currentLevel` to 1
  - [x] 5.9 `Leaderboard` state (from MainMenu): show leaderboard; R/tap → `MainMenu`
  - [x] 5.10 Pass `LevelConfig` to `BotController.setDifficulty()` before each match in `initMatch()`
  - [x] 5.11 Apply `botHealthMultiplier` to bot tank health in `initMatch()`
  - [x] 5.12 Pass `currentLevel` to `Renderer` for HUD display (update `render()` call at `Game.ts:417`)
  - [x] 5.13 Initial state is now `MainMenu` (not `TankSelect`)
  - [x] 5.14 "New Game" resets `currentLevel` to 1 and `levelManager.reset()`; "Continue" sets `currentLevel = lastCompletedLevel + 1`
  - [x] 5.15 Update `initCanvasTouch()` at `Game.ts:74` to handle taps for `MainMenu`, `LevelComplete`, and `Leaderboard` states (in addition to existing `TankSelect` and `GameOver` handling)

- [x] Task 6: Update `src/Renderer.ts` — new screens (AC: 3, 5, 6, 7, 9)
  - [x] 6.1 Add `renderMainMenu(options: string[], selectedIndex: number, hasSave: boolean, continueLevel: number): void`
  - [x] 6.2 Add `renderLevelComplete(level: number): void` — "Level X Complete!" with proceed hint
  - [x] 6.3 Add `renderLeaderboard(entries: LeaderboardEntry[], fromMainMenu: boolean): void` — top 10 table; show "R / Tap to return" hint
  - [x] 6.4 Update `renderGameOver()` to accept leaderboard entries and delegate to `renderLeaderboard(entries, false)`
  - [x] 6.5 Update `renderHUD()` to accept and display `currentLevel` in top-centre
  - [x] 6.6 Update `renderScene()` signature to pass `currentLevel` through to `renderHUD()`
  - [x] 6.7 All new screens: detect `hasTouch`/`hasPointer` and show appropriate control hints (match existing pattern at `Renderer.ts:526-534`)

- [x] Task 7: Name entry HTML overlay (AC: 8, 9)
  - [x] 7.1 In `Game.ts`, create a private `showNameInput(): void` method that:
    - Creates an `<input type="text">` with `maxLength=16`
    - Positions it centred over the canvas using absolute CSS (match canvas rect)
    - Appends it to `document.body`
    - On `keydown` Enter or blur: calls `submitName(input.value.trim() || 'UNKNOWN')` and removes element
  - [x] 7.2 Create `private hideNameInput(): void` that removes any lingering input element
  - [x] 7.3 For touch: include a visible "SUBMIT" button next to the input (or tap-on-Enter-key hint)

- [x] Task 8: Write tests (AC: 10)
  - [x] 8.1 Create `src/LevelManager.test.ts` — test `getLevelConfig` returns correct values at levels 1, 5, 10; test `botHealthMultiplier` caps at 3.0; test `advance()` increments level
  - [x] 8.2 Create `src/SaveManager.test.ts` — add `// @vitest-environment jsdom` header; mock `localStorage`; test load default when empty; test save/load roundtrip; test `addLeaderboardEntry` sorts correctly and trims to 10; test `saveCompletedLevel` only saves if higher than current
  - [x] 8.3 Run `npm run test` — ensure all existing tests still pass (no regressions)

- [x] Task 9: Version bump and changelog (AC: 11)
  - [x] 9.1 Bump `version` in `package.json` from `1.12.0` → `1.13.0`
  - [x] 9.2 Add entry to `CHANGELOG.md` under `## [1.13.0]` following existing format

## Dev Notes

### Architecture Patterns — Critical Rules

- **OO principles**: New classes (`LevelManager`, `SaveManager`) must follow the existing pattern: single-responsibility, constructor-injected config if needed, no global state.
- **No framework**: This is a plain TypeScript/Canvas game. No React, Vue, or other UI framework. All UI is either Canvas 2D or minimal DOM manipulation.
- **ES Modules**: All files use `export class` / `export interface` / `export const`. Import paths use `'./Filename'` (no extension needed, resolved by Vite/TS).
- **Strict TypeScript**: `tsconfig.json` has `strict: true`. No `any`, no implicit returns on non-void functions.
- **Test pattern**: All tests use `import { describe, it, expect } from 'vitest'` — no `beforeEach` setup unless genuinely needed. Tests are co-located with source files (`src/*.test.ts`). Run with `npm run test`.

### State Machine Change (CRITICAL)

Current flow:
```
TankSelect → Playing → GameOver → (R key) → TankSelect
```

New flow:
```
MainMenu ──────────────────────────────────────────────────────────────────┐
  ├─ "New Game"    → TankSelect → Playing → LevelComplete → TankSelect     │
  ├─ "Continue"    → TankSelect (currentLevel = lastCompleted+1)           │
  └─ "Leaderboard" → Leaderboard ──────────── (R/tap) ──────────────────► ┘
                         Playing → NameEntry (bot wins, records currentLevel)
                                 → GameOver (shows leaderboard) → (R/tap) → MainMenu
```

`GameState` enum additions in `src/types.ts`:
```typescript
export enum GameState {
  MainMenu = 'mainmenu',           // NEW — initial state and post-death hub
  TankSelect = 'tankselect',
  Playing = 'playing',
  LevelComplete = 'levelcomplete', // NEW — player won a match
  NameEntry = 'nameentry',         // NEW — player lost, enter name for leaderboard
  Leaderboard = 'leaderboard',     // NEW — standalone leaderboard view from MainMenu
  GameOver = 'gameover',           // Repurposed: shows leaderboard post-NameEntry
}
```

**Leaderboard entry `level` field** = `currentLevel` at the moment the bot kills the player (NOT `lastCompletedLevel`). Store this in `private pendingLeaderboardLevel: number` before transitioning to `NameEntry`.

### Game.ts — Key Changes

The `state` field init changes from `GameState.TankSelect` to `GameState.MainMenu` (`Game.ts:28`).

The `update()` method at `Game.ts:165` needs new `if` branches for `MainMenu`, `LevelComplete`, `NameEntry`, `Leaderboard`.

`checkCollisions()` at `Game.ts:363` currently sets `this.state = GameState.GameOver` when a tank dies. Change to:
- If `bullet.owner === 0` (player's bullet kills bot → player wins): `this.state = GameState.LevelComplete`
- If `bullet.owner === 1` (bot's bullet kills player → player loses): `this.pendingLeaderboardLevel = this.currentLevel; this.state = GameState.NameEntry`

**`initCanvasTouch()` at `Game.ts:74` must be updated** — the existing `handleTap` function only checks `TankSelect` and `GameOver`. Add:
```typescript
} else if (this.state === GameState.MainMenu) {
  this.handleMainMenuTap(x, y);
} else if (this.state === GameState.LevelComplete) {
  this.levelManager.advance(); this.state = GameState.TankSelect;
} else if (this.state === GameState.Leaderboard) {
  this.state = GameState.MainMenu;
}
```

`initMatch()` at `Game.ts:121` must call `botController.setDifficulty(levelManager.getLevelConfig(currentLevel))` and scale bot health.

Bot health scaling example:
```typescript
const levelConfig = this.levelManager.getLevelConfig(this.currentLevel);
this.botController.setDifficulty(levelConfig);
const botTank = new Tank(PlayerSide.Right, this.config, botType);
botTank.health = Math.round(this.config.tankHealth * levelConfig.botHealthMultiplier);
```

### BotController.ts — Refactoring

Replace hardcoded values (search the file before editing):
- `0.3 + Math.random() * 0.4` (move time) — keep as is, difficulty only affects aim
- `this.actionInterval = 0.5` (line ~7) → set from `LevelConfig.botActionInterval`
- `Math.random() - 0.5) * 0.08` (jitter, line ~50) → use `LevelConfig.botJitter`
- `Math.abs(angleDiff) < 0.15 && Math.abs(powerDiff) < 40` (line ~61) → use `LevelConfig.botAngleThreshold` and `LevelConfig.botPowerThreshold`

```typescript
setDifficulty(config: LevelConfig): void {
  this.actionInterval = config.botActionInterval;
  this.jitter = config.botJitter;
  this.angleThreshold = config.botAngleThreshold;
  this.powerThreshold = config.botPowerThreshold;
}
```

Add these as private instance fields with Level 1 defaults as fallback.

### Renderer.ts — renderHUD Signature Change

`renderHUD(tanks: Tank[])` at `Renderer.ts:324` becomes `renderHUD(tanks: Tank[], currentLevel: number)`.

`renderScene(tanks, bullets, activeTankIndex)` at `Renderer.ts:23` becomes `renderScene(tanks, bullets, activeTankIndex, currentLevel)`.

Level display in HUD — add to centre top of canvas:
```typescript
ctx.fillStyle = '#FFD700';
ctx.font = 'bold 14px monospace';
ctx.textAlign = 'center';
ctx.fillText(`LEVEL ${currentLevel}`, canvasWidth / 2, 25);
```

### SaveManager — localStorage Key

```typescript
const SAVE_KEY = 'tank_game_save';
```

Wrap all `localStorage` calls in try/catch to handle environments where storage is disabled (private browsing, etc.). Return defaults gracefully.

### Name Entry Input Element

Position the input element so it appears centred over the canvas. Use the canvas `getBoundingClientRect()` to get screen coordinates. Apply inline styles:
```typescript
input.style.position = 'fixed';
input.style.left = `${rect.left + rect.width / 2 - 100}px`;
input.style.top = `${rect.top + rect.height / 2}px`;
input.style.width = '200px';
input.style.fontSize = '20px';
input.style.textAlign = 'center';
input.style.zIndex = '100';
input.focus();
```

### Test Environment for SaveManager

`SaveManager.test.ts` requires `// @vitest-environment jsdom` at the top since it accesses `localStorage`. The existing tests do NOT need this (they run in node environment).

Reference: `src/Tank.test.ts` — pattern for how tests are structured.

### LevelConfig Formula (documented for tests)

| Level | botJitter | botActionInterval | botAngleThreshold | botPowerThreshold | botHealthMultiplier |
|-------|-----------|-------------------|-------------------|-------------------|---------------------|
| 1     | 0.073     | 0.47              | 0.14              | 37                | 1.1                 |
| 5     | 0.045     | 0.35              | 0.10              | 25                | 1.5                 |
| 10    | 0.01      | 0.20              | 0.05              | 10                | 2.0                 |
| 20    | 0.01      | 0.15 (capped)     | 0.04 (capped)     | 8 (capped)        | 3.0 (capped)        |

### Project Structure Notes

All new files go in `src/`:
- `src/LevelManager.ts` — new
- `src/SaveManager.ts` — new
- `src/LevelManager.test.ts` — new
- `src/SaveManager.test.ts` — new

Modified files:
- `src/types.ts` — enum + interfaces
- `src/Game.ts` — state machine, level logic
- `src/BotController.ts` — difficulty params
- `src/Renderer.ts` — new screens, HUD update
- `package.json` — version bump
- `CHANGELOG.md` — entry

### References

- Existing state machine: [src/Game.ts](src/Game.ts) — `update()` at line 165, `checkCollisions()` at line 363, `initMatch()` at line 121
- Existing GameState enum: [src/types.ts](src/types.ts) — line 24
- BotController hardcoded values: [src/BotController.ts](src/BotController.ts) — lines 7, 17, 49–61
- Renderer touch detection pattern: [src/Renderer.ts](src/Renderer.ts) — lines 526–534
- renderGameOver: [src/Renderer.ts](src/Renderer.ts) — line 538
- Test pattern reference: [src/Tank.test.ts](src/Tank.test.ts)
- Regression test pattern: [src/regression.test.ts](src/regression.test.ts)
- Requirements: [input/requirements.md](input/requirements.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 9 tasks and 35 subtasks implemented and verified
- 123/123 tests pass (92 pre-existing + 31 new: 16 LevelManager + 15 SaveManager)
- TypeScript strict mode compilation clean, production build succeeds
- New GameStates: MainMenu, LevelComplete, NameEntry, Leaderboard, GameOver (repurposed)
- LevelManager: pure difficulty formula, advance/reset/setLevel methods
- SaveManager: localStorage persistence with try/catch guards for private browsing
- BotController: difficulty params extracted to instance fields, setDifficulty() added
- Game.ts: full state machine rewrite, name entry HTML overlay, level progression logic
- Renderer.ts: renderMainMenu, renderLevelComplete, renderNameEntryPrompt, renderLeaderboard added; renderHUD updated with level display; renderScene/renderHUD signatures updated
- package.json bumped to 1.13.0, CHANGELOG.md updated

### File List

- src/types.ts
- src/LevelManager.ts (new)
- src/SaveManager.ts (new)
- src/BotController.ts
- src/Game.ts
- src/Renderer.ts
- src/LevelManager.test.ts (new)
- src/SaveManager.test.ts (new)
- package.json
- CHANGELOG.md

### Change Log

- Story 1.1 created: Level Progression and Leaderboard (2026-05-16)
- Story 1.1 implemented: all tasks complete, 123 tests passing (2026-05-16)
