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
  });

  it('returns saved data after save()', () => {
    const sm = new SaveManager();
    sm.save({ lastCompletedLevel: 3 });
    const data = sm.load();
    expect(data.lastCompletedLevel).toBe(3);
  });

  it('returns default if localStorage contains malformed JSON', () => {
    localStorage.setItem('tank_game_save', 'not-valid-json{{{');
    const sm = new SaveManager();
    const data = sm.load();
    expect(data.lastCompletedLevel).toBe(0);
  });

  it('ignores legacy leaderboard field if present in stored data', () => {
    localStorage.setItem('tank_game_save', JSON.stringify({ lastCompletedLevel: 2, leaderboard: [] }));
    const sm = new SaveManager();
    const data = sm.load();
    expect(data.lastCompletedLevel).toBe(2);
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
