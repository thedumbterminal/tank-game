import { SaveData, LeaderboardEntry } from './types';

const SAVE_KEY = 'tank_game_save';

const DEFAULT_SAVE: SaveData = {
  lastCompletedLevel: 0,
  leaderboard: [],
};

export class SaveManager {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE, leaderboard: [] };
      const parsed = JSON.parse(raw) as SaveData;
      return {
        lastCompletedLevel: parsed.lastCompletedLevel ?? 0,
        leaderboard: Array.isArray(parsed.leaderboard) ? parsed.leaderboard : [],
      };
    } catch {
      return { ...DEFAULT_SAVE, leaderboard: [] };
    }
  }

  save(data: SaveData): void {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      // Storage disabled (e.g. private browsing) — fail silently
    }
  }

  getLastCompletedLevel(): number {
    return this.load().lastCompletedLevel;
  }

  saveCompletedLevel(level: number): void {
    const data = this.load();
    if (level > data.lastCompletedLevel) {
      data.lastCompletedLevel = level;
      this.save(data);
    }
  }

  addLeaderboardEntry(name: string, level: number): SaveData {
    const data = this.load();
    const entry: LeaderboardEntry = {
      name: name.slice(0, 16) || 'UNKNOWN',
      level,
      date: new Date().toISOString(),
    };
    data.leaderboard.push(entry);
    data.leaderboard.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return b.date.localeCompare(a.date);
    });
    data.leaderboard = data.leaderboard.slice(0, 10);
    this.save(data);
    return data;
  }
}
