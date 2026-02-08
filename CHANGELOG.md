# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Common Changelog](https://common-changelog.org/).

## [1.10.0] - 2026-02-08

### Added

- Movement lock after firing: tank cannot move for the remainder of its turn after shooting
- CPU player now moves its tank each turn before aiming and firing (random direction, 0.3-0.7s movement phase)
- BotController unit tests (4 tests covering movement phase, fuel, and aim transition)

## [1.9.0] - 2026-02-08

### Changed

- Realistic tank rendering with detailed side-profile: tracked hull with road wheels, drive sprocket and idler, sloped armor hull with panel lines, rounded turret with commander's cupola, gun barrel with muzzle brake and mantlet
- Tank selection screen uses same realistic tank visuals
- Shared `drawTankBody` method ensures consistent look across game and menus

## [1.8.0] - 2026-02-08

### Added

- Fire button (space) now ends the turn when tank is reloading, so MAUS players can skip their cooldown turn instead of waiting

## [1.7.1] - 2026-02-08

### Fixed

- MAUS tank could fire every turn instead of every 2 turns. Off-by-one in `onFired()` set cooldown to `fireCooldownTurns - 1` instead of `fireCooldownTurns`
- Added regression test to prevent recurrence

## [1.7.0] - 2026-02-08

### Added

- Regression test file (`regression.test.ts`) for tracking bug fix tests as bugs are discovered and resolved

## [1.6.0] - 2026-02-08

### Added

- Unit test suite with vitest covering all game requirements (69 tests)
- Tests for: tank movement, fuel system, health/damage, tank types, bullet physics, terrain generation, craters, and game config
- `npm test` script to run test suite

## [1.5.0] - 2026-02-08

### Changed

- Updated `.nvmrc` to latest stable Node.js 24 (LTS Krypton)
- Tank selection screen now shows image, name, and capabilities table only (removed description text)

## [1.4.0] - 2026-02-08

### Added

- Tank capabilities table on selection screen showing damage, bullets/shot, fire rate, velocity, and crater size
- `.nvmrc` file specifying Node.js 22 for consistent development environments

## [1.3.0] - 2026-02-08

### Added

- Fuel gauge HUD display showing remaining fuel for each tank with color-coded fill (cyan/orange/red)

## [1.2.0] - 2026-02-08

### Added

- Bullet improvements and terrain damage system
- Crater creation on bullet impact with terrain
- Tank type-specific crater sizes (MAUS creates larger craters)

## [1.1.0]

### Added

- Tank selection screen with 3 tank types (M48 GAU-AVENGER, ABRAMS, MAUS)
- Bot opponent with random tank selection
- Fuel system for tank movement
- Arc reticle for aiming with limited range
- Turn-based gameplay with fire cooldowns

## [1.0.0]

### Added

- Initial game with 2D side-on tank combat
- Random terrain generation with hills and trenches
- Player movement, aiming, and firing mechanics
- Health system and game over screen
- GitHub Pages deployment
