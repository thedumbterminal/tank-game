export class InputHandler {
  private readonly keys: Set<string> = new Set();
  private readonly justPressed: Set<string> = new Set();
  private readonly touchActive: Set<string> = new Set();
  private readonly simulatedKeys: Set<string> = new Set();
  private isTouchDevice: boolean = false;

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

    this.initTouchControls();
  }

  private initTouchControls(): void {
    const touchControls = document.getElementById('touch-controls');
    if (!touchControls) return;

    // Detect touch capability and show controls
    const showTouch = () => {
      if (!this.isTouchDevice) {
        this.isTouchDevice = true;
        touchControls.classList.add('visible');
      }
    };

    // Show on coarse pointer or on first touch event
    if (window.matchMedia('(pointer: coarse)').matches) {
      showTouch();
    } else {
      window.addEventListener('touchstart', showTouch, { once: true });
    }

    // Track active touch identifiers per button key to handle multi-touch correctly
    const activeTouches = new Map<string, Set<number>>(); // key -> Set of touch identifiers

    const buttons = touchControls.querySelectorAll<HTMLElement>('.touch-btn');
    buttons.forEach((btn) => {
      const key = btn.dataset.key;
      if (!key) return;
      activeTouches.set(key, new Set());

      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touches = activeTouches.get(key)!;
        for (let i = 0; i < e.changedTouches.length; i++) {
          touches.add(e.changedTouches[i].identifier);
        }
        btn.classList.add('pressed');
        if (!this.touchActive.has(key)) {
          this.justPressed.add(key);
        }
        this.touchActive.add(key);
        this.keys.add(key);
      }, { passive: false });

      const releaseTouch = (e: TouchEvent) => {
        e.preventDefault();
        const touches = activeTouches.get(key)!;
        for (let i = 0; i < e.changedTouches.length; i++) {
          touches.delete(e.changedTouches[i].identifier);
        }
        // Only release key when ALL touches on this button are gone
        if (touches.size === 0) {
          btn.classList.remove('pressed');
          this.touchActive.delete(key);
          this.keys.delete(key);
        }
      };

      btn.addEventListener('touchend', releaseTouch, { passive: false });
      btn.addEventListener('touchcancel', releaseTouch, { passive: false });
    });

    // Global touchcancel: clear ALL touch state on app interruption
    window.addEventListener('touchcancel', () => {
      this.clearAllTouchState(touchControls, activeTouches);
    });

    // Also clear on visibility change (tab switch, app background)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clearAllTouchState(touchControls, activeTouches);
      }
    });
  }

  private clearAllTouchState(
    container: HTMLElement,
    activeTouches: Map<string, Set<number>>
  ): void {
    this.touchActive.clear();
    for (const [key, touches] of activeTouches) {
      touches.clear();
      this.keys.delete(key);
    }
    container.querySelectorAll('.pressed').forEach((btn) => {
      btn.classList.remove('pressed');
    });
  }

  /** Simulate a key press from external source (e.g. canvas tap) */
  simulatePress(key: string): void {
    this.justPressed.add(key);
    this.keys.add(key);
    this.simulatedKeys.add(key);
  }

  isDown(key: string): boolean {
    return this.keys.has(key);
  }

  wasPressed(key: string): boolean {
    return this.justPressed.has(key);
  }

  clearFrame(): void {
    this.justPressed.clear();
    // Release simulated keys synchronously with game loop
    for (const key of this.simulatedKeys) {
      this.keys.delete(key);
    }
    this.simulatedKeys.clear();
  }

  getIsTouchDevice(): boolean {
    return this.isTouchDevice;
  }
}
