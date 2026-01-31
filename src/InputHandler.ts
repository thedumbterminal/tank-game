export class InputHandler {
  private readonly keys: Set<string> = new Set();
  private readonly justPressed: Set<string> = new Set();

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.key)) {
        this.justPressed.add(e.key);
      }
      this.keys.add(e.key);
    });

    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });
  }

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  wasPressed(key: string): boolean {
    return this.justPressed.has(key);
  }

  clearFrame(): void {
    this.justPressed.clear();
  }
}
