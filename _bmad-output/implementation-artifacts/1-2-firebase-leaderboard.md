# Story 1.2: Firebase Firestore Leaderboard

Status: review

## Story

As a player,
I want the leaderboard to be stored server-side so all players can see the same top scores,
so that the competition is global and meaningful.

## Acceptance Criteria

1. **Server-side storage**: Leaderboard entries are written to and read from Firebase Firestore, not localStorage. All players using the game see the same shared leaderboard.

2. **Submit entry on death**: When the player loses and submits their name, the entry (name, level, timestamp) is written to Firestore. The game transitions immediately to the GameOver screen (leaderboard view) while the write and fetch happen asynchronously.

3. **Fetch leaderboard**: Top 10 entries ordered by level descending are fetched from Firestore for display. If Firestore is unavailable (offline, misconfigured), the leaderboard displays gracefully (empty or cached if available).

4. **Leaderboard from main menu**: Selecting "Leaderboard" from the main menu fetches the top 10 from Firestore and displays them. A loading indicator is shown while the fetch is in progress.

5. **LocalStorage unchanged**: Level progress (`lastCompletedLevel`) continues to be stored in localStorage via `SaveManager`. The `leaderboard` field is removed from `SaveData`.

6. **Environment config**: Firebase configuration is loaded from Vite environment variables (`VITE_FIREBASE_*`). A `.env.example` file is committed. `.env` is added to `.gitignore`. TypeScript types for `import.meta.env` are declared in `src/vite-env.d.ts`.

7. **Firestore security rules**: The `leaderboard` collection is publicly readable. New documents can be created if they pass field validation (name: string 1-16 chars, level: number >= 1, timestamp: timestamp). Updates and deletes are denied.

8. **GitHub Actions deployment**: The `static.yml` workflow is updated to pass Firebase env vars from repository secrets during `npm run build`.

9. **Graceful fallback**: If Firebase is not configured (env vars absent) or initialization fails, `FirebaseService` silently operates in no-op mode — `fetchLeaderboard()` returns `[]`, `submitEntry()` resolves without error. The game remains playable without Firebase.

10. **Tests**: `FirebaseService` has unit tests covering: null-db no-op behavior (returns empty array / resolves without throwing), data mapping from Firestore document to `LeaderboardEntry`. `SaveManager.test.ts` leaderboard tests are removed. All existing tests continue to pass.

11. **Version and changelog**: `package.json` version bumped to `1.14.0`. `CHANGELOG.md` updated.

## Tasks / Subtasks

- [x] Task 1: Install firebase package (AC: 1)
  - [x] 1.1 Run `npm install firebase` to add firebase as a production dependency
  - [x] 1.2 Confirm `package.json` now lists `firebase` under `dependencies` (NOT devDependencies)

- [x] Task 2: Environment config setup (AC: 6)
  - [x]2.1 Create `src/vite-env.d.ts` declaring `ImportMetaEnv` interface with all `VITE_FIREBASE_*` keys
  - [x]2.2 Create `.env.example` at project root with placeholder values for all 6 Firebase config keys
  - [x]2.3 Add `.env` and `.env.local` to `.gitignore`
  - [x]2.4 Create `.env` at project root with real Firebase values (do NOT commit this file)

- [x] Task 3: Create `src/FirebaseService.ts` (AC: 1, 2, 3, 4, 9)
  - [x]3.1 Import from `firebase/app`: `initializeApp`, `getApps`, `getApp`
  - [x]3.2 Import from `firebase/firestore`: `getFirestore`, `Firestore`, `collection`, `addDoc`, `getDocs`, `query`, `orderBy`, `limit`, `Timestamp`
  - [x]3.3 Read Firebase config from `import.meta.env.VITE_FIREBASE_*` environment variables
  - [x]3.4 Constructor: if `VITE_FIREBASE_PROJECT_ID` is falsy, set `this.db = null` and return (no-op mode). Otherwise initialize via `getApps().length > 0 ? getApp() : initializeApp(config)` to avoid duplicate-app error
  - [x]3.5 Implement `async submitEntry(name: string, level: number): Promise<void>` — writes `{ name, level, timestamp: Timestamp.now() }` to `collection(db, 'leaderboard')` via `addDoc`. Name is already trimmed/validated by caller; method wraps in try/catch and logs errors
  - [x]3.6 Implement `async fetchLeaderboard(): Promise<LeaderboardEntry[]>` — queries `leaderboard` collection with `orderBy('level', 'desc')` and `limit(10)`, maps each doc to `LeaderboardEntry` converting Firestore `Timestamp` to ISO string for `date` field. Returns `[]` if `db` is null or on error
  - [x]3.7 Export class `FirebaseService`

- [x] Task 4: Update `src/types.ts` (AC: 5)
  - [x]4.1 Remove `leaderboard: LeaderboardEntry[]` from `SaveData` interface — it becomes `{ lastCompletedLevel: number }` only

- [x] Task 5: Update `src/SaveManager.ts` (AC: 5)
  - [x]5.1 Remove `addLeaderboardEntry()` method entirely
  - [x]5.2 Update `load()`: remove `leaderboard` from returned object and from the parsed data shape. Handle backward-compat: old localStorage data may have a `leaderboard` key — simply ignore it on read
  - [x]5.3 Update `save(data: SaveData)`: only writes `{ lastCompletedLevel }` — no leaderboard field
  - [x]5.4 Update `DEFAULT_SAVE` constant: remove `leaderboard: []`

- [x] Task 6: Update `src/Game.ts` — async leaderboard integration (AC: 2, 3, 4, 9)
  - [x]6.1 Import `FirebaseService` and add `private readonly firebaseService: FirebaseService` field, instantiated in constructor (no arguments)
  - [x]6.2 Add `private leaderboardLoading: boolean = false` field to track async fetch state
  - [x]6.3 Update `submitName()`: make it `private async submitName(name: string): Promise<void>`. After `hideNameInput()`, immediately set `this.currentLeaderboard = []`, `this.leaderboardLoading = true`, `this.levelManager.reset()`, `this.state = GameState.GameOver`. Then await `firebaseService.submitEntry(name, pendingLeaderboardLevel)` followed by `this.currentLeaderboard = await firebaseService.fetchLeaderboard()`. On error (try/catch), leave `currentLeaderboard` empty. Set `leaderboardLoading = false` in `finally`
  - [x]6.4 Update `selectMenuOption()` leaderboard branch: set `this.currentLeaderboard = []`, `this.leaderboardLoading = true`, `this.state = GameState.Leaderboard`, then call `firebaseService.fetchLeaderboard().then(entries => { this.currentLeaderboard = entries; }).catch(() => {}).finally(() => { this.leaderboardLoading = false; })`
  - [x]6.5 Remove the `Leaderboard` render branch that calls `saveManager.load().leaderboard` — it now uses `this.currentLeaderboard` (same as `GameOver` render)
  - [x]6.6 Pass `this.leaderboardLoading` to `renderLeaderboard()` calls in `render()` method

- [x] Task 7: Update `src/Renderer.ts` — loading state (AC: 4)
  - [x]7.1 Update `renderLeaderboard(entries: LeaderboardEntry[], fromMainMenu: boolean, loading?: boolean)` signature to add optional `loading` parameter
  - [x]7.2 When `loading` is true, render "Fetching leaderboard..." text in place of the entries table (or above it). Use same gold `#FFD700` colour as headings, centred, font `bold 18px monospace`

- [x] Task 8: Create `firestore.rules` (AC: 7)
  - [x]8.1 Create `firestore.rules` at project root with rules that: allow read on all `/leaderboard/{entry}` documents, allow create if fields are `name` (string, 1-16 chars), `level` (number >= 1), `timestamp` (timestamp), `hasOnly(['name','level','timestamp'])`. Deny update and delete.

- [x] Task 9: Update `.github/workflows/static.yml` (AC: 8)
  - [x]9.1 Add `env:` block to the `npm run build` step passing all 6 `VITE_FIREBASE_*` secrets as environment variables: `VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}` etc.

- [x] Task 10: Update `src/SaveManager.test.ts` (AC: 10)
  - [x]10.1 Remove the entire `describe('SaveManager.addLeaderboardEntry()')` block (7 tests)
  - [x]10.2 Remove from `describe('SaveManager.load()')` any tests that reference the `leaderboard` field: specifically "returns default leaderboard array if missing from stored data" — update or remove it
  - [x]10.3 Update the "returns default data when localStorage is empty" test — remove `expect(data.leaderboard).toEqual([])` assertion
  - [x]10.4 Verify `describe('SaveManager.saveCompletedLevel()')` tests still pass unchanged (they don't touch leaderboard)

- [x] Task 11: Create `src/FirebaseService.test.ts` (AC: 10)
  - [x]11.1 Mock `firebase/app` and `firebase/firestore` modules with `vi.mock()`
  - [x]11.2 Test: when `VITE_FIREBASE_PROJECT_ID` env var is absent, `fetchLeaderboard()` returns `[]`
  - [x]11.3 Test: when `VITE_FIREBASE_PROJECT_ID` env var is absent, `submitEntry()` resolves without throwing
  - [x]11.4 Test: `fetchLeaderboard()` correctly maps Firestore docs to `LeaderboardEntry[]` — mock `getDocs` to return fake docs with `name`, `level`, `timestamp.toDate()` values; assert output shape
  - [x]11.5 Test: `submitEntry()` calls `addDoc` with correct payload (`name`, `level`, `timestamp`)

- [x] Task 12: Version bump and changelog (AC: 11)
  - [x]12.1 Bump `version` in `package.json` from `1.13.0` → `1.14.0`
  - [x]12.2 Add entry to `CHANGELOG.md` under `## [1.14.0]`

- [x] Task 13: Run tests and validate build (AC: 10)
  - [x]13.1 Run `nvm use && npm run test` — all tests pass
  - [x]13.2 Run `npm run build` — build succeeds (TypeScript compiles clean, no errors)

## Dev Notes

### Stack & Constraints

- **TypeScript strict mode** (`strict: true`) — no `any`, all types explicit
- **ES Modules** — `import { initializeApp } from 'firebase/app'` (modular SDK, NOT compat SDK)
- **Vite 7** — env vars via `import.meta.env.VITE_*` (only `VITE_`-prefixed vars are exposed to the browser bundle)
- **Firebase JS SDK** — install latest stable (`npm install firebase`). As of 2026, this is the v9+ modular SDK
- **No UI framework** — Renderer is Canvas 2D only; loading state is drawn on canvas, NOT a DOM element
- **Vitest 4** — supports `vi.mock()` hoisting and `vi.stubEnv()` for env var overrides in tests
- **GitHub Pages** — static site; Firebase credentials are public in the bundle (by design). Security is enforced entirely by Firestore security rules, NOT by hiding the API key

### Firebase Project Setup (one-time, not in code)

The developer must set up Firebase before the env vars are available:

1. Go to [Firebase Console](https://console.firebase.google.com/) → "Add project" → select your existing GCP project
2. Enable Firestore Database: Build → Firestore Database → Create Database → choose region → Start in Production mode
3. Deploy the `firestore.rules` file (via Firebase Console Rules tab, or `firebase deploy --only firestore:rules` if Firebase CLI is installed)
4. Register a web app: Project settings → "Add app" → Web app → copy the `firebaseConfig` object
5. Copy the config values into your `.env` file

### `src/vite-env.d.ts` — Required for TypeScript

Create this file so TypeScript understands `import.meta.env.VITE_*` keys:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### `.env.example` (commit this file)

```
VITE_FIREBASE_API_KEY=your-api-key-here
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_APP_ID=1:000000000000:web:000000000000000000000000
```

### `FirebaseService.ts` — Complete Design

```typescript
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore, Firestore, collection, addDoc,
  getDocs, query, orderBy, limit, Timestamp
} from 'firebase/firestore';
import { LeaderboardEntry } from './types';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

export class FirebaseService {
  private db: Firestore | null = null;

  constructor() {
    if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) return; // no-op mode
    try {
      const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      this.db = getFirestore(app);
    } catch (e) {
      console.error('Firebase init failed:', e);
    }
  }

  async submitEntry(name: string, level: number): Promise<void> {
    if (!this.db) return;
    try {
      await addDoc(collection(this.db, 'leaderboard'), {
        name,
        level,
        timestamp: Timestamp.now(),
      });
    } catch (e) {
      console.error('Leaderboard submit failed:', e);
    }
  }

  async fetchLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!this.db) return [];
    try {
      const q = query(
        collection(this.db, 'leaderboard'),
        orderBy('level', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => {
        const d = doc.data();
        const ts = d['timestamp'] as Timestamp | undefined;
        return {
          name:  d['name'] as string,
          level: d['level'] as number,
          date:  ts ? ts.toDate().toISOString() : new Date().toISOString(),
        };
      });
    } catch (e) {
      console.error('Leaderboard fetch failed:', e);
      return [];
    }
  }
}
```

**Critical**: Use `getApps().length > 0 ? getApp() : initializeApp(config)` — calling `initializeApp()` twice throws "Firebase: Firebase App named '[DEFAULT]' already exists". This matters in dev with HMR.

### `Game.ts` — Key Changes

**New field** (add next to `nameInputEl`):
```typescript
private leaderboardLoading: boolean = false;
```

**New import** at top:
```typescript
import { FirebaseService } from './FirebaseService';
```

**New readonly field** (add next to `saveManager`):
```typescript
private readonly firebaseService: FirebaseService;
```

**Constructor** — add after `saveManager` init:
```typescript
this.firebaseService = new FirebaseService();
```

**`submitName()` — full replacement** (currently synchronous, becomes async):
```typescript
private async submitName(name: string): Promise<void> {
  this.hideNameInput();
  this.currentLeaderboard = [];
  this.leaderboardLoading = true;
  this.levelManager.reset();
  this.state = GameState.GameOver;

  try {
    await this.firebaseService.submitEntry(name, this.pendingLeaderboardLevel);
    this.currentLeaderboard = await this.firebaseService.fetchLeaderboard();
  } catch (e) {
    console.error('Leaderboard error:', e);
  } finally {
    this.leaderboardLoading = false;
  }
}
```

**`selectMenuOption()` — leaderboard branch replacement** (currently reads `save.leaderboard`):
```typescript
// Replace:
this.currentLeaderboard = save.leaderboard;
this.state = GameState.Leaderboard;

// With:
this.currentLeaderboard = [];
this.leaderboardLoading = true;
this.state = GameState.Leaderboard;
this.firebaseService.fetchLeaderboard()
  .then((entries) => { this.currentLeaderboard = entries; })
  .catch(() => { /* leave empty, graceful fallback */ })
  .finally(() => { this.leaderboardLoading = false; });
```

**`render()` — Leaderboard and GameOver branches** — pass `this.leaderboardLoading`:
```typescript
// Leaderboard state (was reading save.leaderboard — now uses this.currentLeaderboard):
this.renderer.renderLeaderboard(this.currentLeaderboard, true, this.leaderboardLoading);

// GameOver state (already uses this.currentLeaderboard — add loading param):
this.renderer.renderLeaderboard(this.currentLeaderboard, false, this.leaderboardLoading);
```

### `SaveData` — Remove `leaderboard` field

Before (current `src/types.ts`):
```typescript
export interface SaveData {
  lastCompletedLevel: number;
  leaderboard: LeaderboardEntry[];
}
```

After:
```typescript
export interface SaveData {
  lastCompletedLevel: number;
}
```

**`SaveManager.load()`** — update to not return `leaderboard`:
```typescript
load(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { lastCompletedLevel: 0 };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      lastCompletedLevel: typeof parsed['lastCompletedLevel'] === 'number' ? parsed['lastCompletedLevel'] : 0,
    };
  } catch {
    return { lastCompletedLevel: 0 };
  }
}
```

**`SaveManager.save()`** — already takes `SaveData`, will now only write `lastCompletedLevel`.

**Remove from `SaveManager`**:
- `addLeaderboardEntry()` method (entire method, ~15 lines)
- `DEFAULT_SAVE.leaderboard` property

### `Renderer.ts` — `renderLeaderboard` Loading State

Update signature:
```typescript
renderLeaderboard(entries: LeaderboardEntry[], fromMainMenu: boolean, loading: boolean = false): void
```

Add loading branch at the top of the method (before the entries table):
```typescript
if (loading) {
  this.ctx.fillStyle = '#FFD700';
  this.ctx.font = 'bold 18px monospace';
  this.ctx.textAlign = 'center';
  this.ctx.fillText('Fetching leaderboard...', this.config.canvasWidth / 2, this.config.canvasHeight / 2);
  return; // or show this alongside the header, then return
}
```

### Firestore Security Rules (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /leaderboard/{entry} {
      allow read: if true;
      allow create: if
        request.resource.data.keys().hasOnly(['name', 'level', 'timestamp']) &&
        request.resource.data.name is string &&
        request.resource.data.name.size() >= 1 &&
        request.resource.data.name.size() <= 16 &&
        request.resource.data.level is number &&
        request.resource.data.level >= 1 &&
        request.resource.data.timestamp is timestamp;
      allow update, delete: if false;
    }
  }
}
```

Deploy via Firebase Console: Firestore → Rules → paste → Publish.

### GitHub Actions — Passing Firebase Secrets

The `static.yml` deploy step `npm run build` must receive env vars. Add this to the `npm run build` step:

```yaml
- run: npm run build
  env:
    VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
    VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.VITE_FIREBASE_AUTH_DOMAIN }}
    VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
    VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.VITE_FIREBASE_STORAGE_BUCKET }}
    VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.VITE_FIREBASE_MESSAGING_SENDER_ID }}
    VITE_FIREBASE_APP_ID: ${{ secrets.VITE_FIREBASE_APP_ID }}
```

**After this story is implemented**: Go to GitHub repo → Settings → Secrets and variables → Actions → Add the 6 `VITE_FIREBASE_*` repository secrets.

### `FirebaseService.test.ts` — Test Strategy

The no-op mode (absent `VITE_FIREBASE_PROJECT_ID`) is the primary testable path without complex Firebase mocking:

**No `// @vitest-environment jsdom` needed** — `FirebaseService` does not touch the DOM; runs in default `node` environment.

```typescript
// src/FirebaseService.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.mock calls are HOISTED by Vitest — they run before all imports
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'test' })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(),
}));

const mockAddDoc = vi.fn().mockResolvedValue({ id: 'new-id' });
const mockGetDocs = vi.fn();
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ type: 'firestore-mock' })),
  collection: vi.fn(() => ({})),
  addDoc: (...args: unknown[]) => mockAddDoc(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  query: vi.fn(() => ({})),
  orderBy: vi.fn(),
  limit: vi.fn(),
  Timestamp: { now: vi.fn(() => ({ toDate: () => new Date('2026-01-01') })) },
}));

import { FirebaseService } from './FirebaseService';

describe('FirebaseService (no-op mode)', () => {
  beforeEach(() => {
    // Force env var empty so tests are reliable whether or not a local .env exists
    // (Vitest loads .env files via Vite — a local .env with real values would break these tests)
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', '');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('fetchLeaderboard returns [] when not initialized', async () => {
    const svc = new FirebaseService();
    expect(await svc.fetchLeaderboard()).toEqual([]);
  });

  it('submitEntry resolves without throwing when not initialized', async () => {
    const svc = new FirebaseService();
    await expect(svc.submitEntry('Alice', 5)).resolves.toBeUndefined();
  });
});
```

**CRITICAL naming distinction**: In Firestore the field is named `timestamp` (a Firestore Timestamp object). In `LeaderboardEntry` the field is named `date` (ISO string). The `fetchLeaderboard()` method maps `timestamp → date` via `ts.toDate().toISOString()`. Do NOT store a field named `date` in Firestore — the security rules reject it.

### `SaveManager.test.ts` — Tests to Remove

Remove these entire `describe` blocks / tests:
- `describe('SaveManager.addLeaderboardEntry()')` — all 7 tests in this block
- From `describe('SaveManager.load()')`:
  - Remove: `'returns default leaderboard array if missing from stored data'`
  - Update: `'returns default data when localStorage is empty'` — remove `expect(data.leaderboard).toEqual([])` line

### Project Structure Notes

**New files:**
- `src/FirebaseService.ts`
- `src/FirebaseService.test.ts`
- `src/vite-env.d.ts`
- `.env.example` (committed)
- `.env` (gitignored — contains real credentials)
- `firestore.rules`

**Modified files:**
- `src/types.ts` — remove `leaderboard` from `SaveData`
- `src/SaveManager.ts` — remove `addLeaderboardEntry()`, update `load()`/`save()`
- `src/Game.ts` — add `FirebaseService`, async `submitName()`, async leaderboard fetch
- `src/Renderer.ts` — add `loading` param to `renderLeaderboard()`
- `src/SaveManager.test.ts` — remove leaderboard tests
- `.github/workflows/static.yml` — add Firebase env vars to build step
- `.gitignore` — add `.env` and `.env.local`
- `package.json` — version bump + firebase dependency
- `CHANGELOG.md` — new entry

### References

- Previous story: [1-1-level-progression-and-leaderboard.md](1-1-level-progression-and-leaderboard.md)
- Game state machine: [src/Game.ts](src/Game.ts) — `submitName()` at line 555, `selectMenuOption()` at line 141, `render()` at line 563
- Current `SaveManager`: [src/SaveManager.ts](src/SaveManager.ts)
- Leaderboard renderer: [src/Renderer.ts](src/Renderer.ts) — `renderLeaderboard()`
- Types: [src/types.ts](src/types.ts) — `SaveData` at line 49, `LeaderboardEntry` at line 43
- SaveManager tests: [src/SaveManager.test.ts](src/SaveManager.test.ts)
- GitHub Actions: [.github/workflows/static.yml](.github/workflows/static.yml)
- Requirements: [input/requirements.md](input/requirements.md) — Leaderboard section

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 13 tasks and all subtasks implemented and verified
- 120/120 tests pass (116 pre-existing + 4 new FirebaseService tests)
- TypeScript strict mode compilation clean (`tsc` exits 0)
- Production build succeeds (Vite 7, 28 modules, 284 KB bundle)
- `firebase` 12.13.0 installed as production dependency
- `FirebaseService`: no-op mode when `VITE_FIREBASE_PROJECT_ID` absent; graceful error handling in both `submitEntry` and `fetchLeaderboard`
- `getApps().length > 0 ? getApp() : initializeApp()` pattern prevents duplicate-app error with HMR
- `SaveData` simplified to `{ lastCompletedLevel }` — leaderboard field fully removed
- `SaveManager.addLeaderboardEntry()` removed; `SaveManager.test.ts` reduced from 15 to 8 tests
- `Game.ts`: `submitName()` is async, immediately transitions to `GameOver` state while Firebase write+fetch run async; `selectMenuOption()` leaderboard branch uses `.then().catch().finally()` pattern
- `Renderer.ts`: `renderLeaderboard()` accepts optional `loading: boolean = false`; shows gold "Fetching leaderboard..." text when loading
- Firestore security rules: public read, validated create (name/level/timestamp only), deny update/delete
- GitHub Actions: `npm run build` receives all 6 `VITE_FIREBASE_*` from repository secrets
- `src/vite-env.d.ts` created for TypeScript `import.meta.env` declarations
- `.env` and `.env.local` added to `.gitignore`

### File List

- src/FirebaseService.ts (new)
- src/FirebaseService.test.ts (new)
- src/vite-env.d.ts (new)
- firestore.rules (new)
- .env.example (new)
- src/types.ts
- src/SaveManager.ts
- src/SaveManager.test.ts
- src/Game.ts
- src/Renderer.ts
- .github/workflows/static.yml
- .gitignore
- package.json
- package-lock.json
- CHANGELOG.md

### Change Log

- Story 1.2 created: Firebase Firestore Leaderboard (2026-05-16)
- Story 1.2 implemented: all 13 tasks complete, 120/120 tests pass, build clean (2026-05-16)
