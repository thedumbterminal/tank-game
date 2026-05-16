import { SaveData } from './types';

const SAVE_KEY = 'tank_game_save';

const DEFAULT_SAVE: SaveData = {
  lastCompletedLevel: 0,
};

export class SaveManager {
  load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return { ...DEFAULT_SAVE };
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        lastCompletedLevel: typeof parsed['lastCompletedLevel'] === 'number' ? parsed['lastCompletedLevel'] : 0,
      };
    } catch {
      return { ...DEFAULT_SAVE };
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
}
