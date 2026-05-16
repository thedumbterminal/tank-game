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
    vi.clearAllMocks();
  });

  it('fetchLeaderboard returns [] when not initialized', async () => {
    const svc = new FirebaseService();
    const result = await svc.fetchLeaderboard();
    expect(result).toEqual([]);
  });

  it('submitEntry resolves without throwing when not initialized', async () => {
    const svc = new FirebaseService();
    await expect(svc.submitEntry('Alice', 5)).resolves.toBeUndefined();
  });

  it('fetchLeaderboard maps Firestore docs to LeaderboardEntry[]', async () => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    mockGetDocs.mockResolvedValueOnce({
      docs: [
        {
          id: '1',
          data: () => ({
            name: 'Alice',
            level: 7,
            timestamp: { toDate: () => new Date('2026-01-01T00:00:00.000Z') },
          }),
        },
        {
          id: '2',
          data: () => ({
            name: 'Bob',
            level: 3,
            timestamp: { toDate: () => new Date('2026-01-02T00:00:00.000Z') },
          }),
        },
      ],
    });

    const svc = new FirebaseService();
    const entries = await svc.fetchLeaderboard();

    expect(entries).toHaveLength(2);
    expect(entries[0].name).toBe('Alice');
    expect(entries[0].level).toBe(7);
    expect(entries[0].date).toBe('2026-01-01T00:00:00.000Z');
    expect(entries[1].name).toBe('Bob');
    expect(entries[1].level).toBe(3);
  });

  it('submitEntry calls addDoc with correct payload', async () => {
    vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');

    const svc = new FirebaseService();
    await svc.submitEntry('Mark', 10);

    expect(mockAddDoc).toHaveBeenCalledOnce();
    const payload = mockAddDoc.mock.calls[0][1] as { name: string; level: number; timestamp: unknown };
    expect(payload.name).toBe('Mark');
    expect(payload.level).toBe(10);
    expect(payload.timestamp).toBeDefined();
  });
});
