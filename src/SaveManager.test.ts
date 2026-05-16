// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { SaveManager } from './SaveManager';

beforeEach(() => {
  localStorage.clear();
});

describe('SaveManager.load()', () => {
  it('returns default data when localStorage is empty', () => {
    const sm = new SaveManager();
    const data = sm.load();
    expect(data.lastCompletedLevel).toBe(0);
    expect(data.leaderboard).toEqual([]);
  });

  it('returns saved data after save()', () => {
    const sm = new SaveManager();
    sm.save({ lastCompletedLevel: 3, leaderboard: [] });
    const data = sm.load();
    expect(data.lastCompletedLevel).toBe(3);
  });

  it('returns default if localStorage contains malformed JSON', () => {
    localStorage.setItem('tank_game_save', 'not-valid-json{{{');
    const sm = new SaveManager();
    const data = sm.load();
    expect(data.lastCompletedLevel).toBe(0);
    expect(data.leaderboard).toEqual([]);
  });

  it('returns default leaderboard array if missing from stored data', () => {
    localStorage.setItem('tank_game_save', JSON.stringify({ lastCompletedLevel: 2 }));
    const sm = new SaveManager();
    const data = sm.load();
    expect(Array.isArray(data.leaderboard)).toBe(true);
  });
});

describe('SaveManager.saveCompletedLevel()', () => {
  it('saves the level when higher than current', () => {
    const sm = new SaveManager();
    sm.saveCompletedLevel(5);
    expect(sm.getLastCompletedLevel()).toBe(5);
  });

  it('does not overwrite with a lower level', () => {
    const sm = new SaveManager();
    sm.saveCompletedLevel(5);
    sm.saveCompletedLevel(3);
    expect(sm.getLastCompletedLevel()).toBe(5);
  });

  it('saves when equal level is passed (no change needed, still doesn\'t overwrite)', () => {
    const sm = new SaveManager();
    sm.saveCompletedLevel(4);
    sm.saveCompletedLevel(4);
    expect(sm.getLastCompletedLevel()).toBe(4);
  });

  it('getLastCompletedLevel returns 0 when nothing saved', () => {
    const sm = new SaveManager();
    expect(sm.getLastCompletedLevel()).toBe(0);
  });
});

describe('SaveManager.addLeaderboardEntry()', () => {
  it('adds an entry to the leaderboard', () => {
    const sm = new SaveManager();
    const data = sm.addLeaderboardEntry('Alice', 5);
    expect(data.leaderboard).toHaveLength(1);
    expect(data.leaderboard[0].name).toBe('Alice');
    expect(data.leaderboard[0].level).toBe(5);
  });

  it('sorts entries by level descending', () => {
    const sm = new SaveManager();
    sm.addLeaderboardEntry('Bob', 3);
    sm.addLeaderboardEntry('Alice', 7);
    const data = sm.addLeaderboardEntry('Carol', 5);
    expect(data.leaderboard[0].name).toBe('Alice');
    expect(data.leaderboard[1].name).toBe('Carol');
    expect(data.leaderboard[2].name).toBe('Bob');
  });

  it('trims leaderboard to top 10 entries', () => {
    const sm = new SaveManager();
    for (let i = 0; i < 11; i++) {
      sm.addLeaderboardEntry(`Player${i}`, i);
    }
    const data = sm.load();
    expect(data.leaderboard).toHaveLength(10);
  });

  it('keeps the highest-level entries when trimming', () => {
    const sm = new SaveManager();
    for (let i = 1; i <= 11; i++) {
      sm.addLeaderboardEntry(`Player${i}`, i);
    }
    const data = sm.load();
    // Should have levels 11 down to 2 (top 10), NOT level 1
    const levels = data.leaderboard.map((e) => e.level);
    expect(levels).not.toContain(1);
    expect(levels).toContain(11);
  });

  it('truncates name to 16 characters', () => {
    const sm = new SaveManager();
    const data = sm.addLeaderboardEntry('ThisNameIsWayTooLong', 3);
    expect(data.leaderboard[0].name.length).toBeLessThanOrEqual(16);
  });

  it('uses UNKNOWN for empty name', () => {
    const sm = new SaveManager();
    const data = sm.addLeaderboardEntry('', 3);
    expect(data.leaderboard[0].name).toBe('UNKNOWN');
  });

  it('persists entries across SaveManager instances', () => {
    const sm1 = new SaveManager();
    sm1.addLeaderboardEntry('Mark', 10);

    const sm2 = new SaveManager();
    const data = sm2.load();
    expect(data.leaderboard[0].name).toBe('Mark');
  });
});
