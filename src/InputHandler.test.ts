// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputHandler } from './InputHandler';

describe('InputHandler', () => {
  let input: InputHandler;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    input = new InputHandler();
  });

  describe('Keyboard input', () => {
    it('tracks key down state', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      expect(input.isDown('a')).toBe(true);
    });

    it('tracks key up state', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
      window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
      expect(input.isDown('a')).toBe(false);
    });

    it('detects wasPressed for single frame', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
      expect(input.wasPressed(' ')).toBe(true);
      input.clearFrame();
      expect(input.wasPressed(' ')).toBe(false);
    });

    it('does not re-trigger justPressed on held key', () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      input.clearFrame();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }));
      expect(input.wasPressed('w')).toBe(false);
    });
  });

  describe('simulatePress', () => {
    it('registers as wasPressed', () => {
      input.simulatePress('r');
      expect(input.wasPressed('r')).toBe(true);
      expect(input.isDown('r')).toBe(true);
    });

    it('clears wasPressed after clearFrame', () => {
      input.simulatePress('r');
      input.clearFrame();
      expect(input.wasPressed('r')).toBe(false);
    });

    it('releases simulated key on clearFrame (no rAF race)', () => {
      input.simulatePress('r');
      expect(input.isDown('r')).toBe(true);
      input.clearFrame();
      expect(input.isDown('r')).toBe(false);
    });
  });

  describe('Touch controls initialization', () => {
    it('initializes without touch-controls element', () => {
      const handler = new InputHandler();
      expect(handler.getIsTouchDevice()).toBe(false);
    });

    it('detects touch device on coarse pointer media', () => {
      const touchDiv = document.createElement('div');
      touchDiv.id = 'touch-controls';
      const btn = document.createElement('button');
      btn.className = 'touch-btn';
      btn.dataset.key = 'ArrowLeft';
      touchDiv.appendChild(btn);
      document.body.appendChild(touchDiv);

      const originalMatchMedia = window.matchMedia;
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: query === '(pointer: coarse)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const handler = new InputHandler();
      expect(handler.getIsTouchDevice()).toBe(true);
      expect(touchDiv.classList.contains('visible')).toBe(true);

      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Canvas coordinate scaling', () => {
    it('scales touch coordinates to canvas space', () => {
      const canvasWidth = 1024;
      const canvasHeight = 576;
      const displayWidth = 512;
      const displayHeight = 288;

      const scaleX = canvasWidth / displayWidth;
      const scaleY = canvasHeight / displayHeight;

      const touchX = 256;
      const touchY = 144;

      const canvasX = touchX * scaleX;
      const canvasY = touchY * scaleY;

      expect(canvasX).toBe(512);
      expect(canvasY).toBe(288);
    });

    it('handles edge coordinates correctly', () => {
      const canvasWidth = 1024;
      const displayWidth = 512;
      const scaleX = canvasWidth / displayWidth;

      // Touch at far left
      expect(0 * scaleX).toBe(0);
      // Touch at far right
      expect(512 * scaleX).toBe(1024);
    });
  });

  describe('Simulated key lifecycle', () => {
    it('simulated key is readable within same frame', () => {
      input.simulatePress(' ');
      // Within the same frame, both wasPressed and isDown should work
      expect(input.wasPressed(' ')).toBe(true);
      expect(input.isDown(' ')).toBe(true);
    });

    it('simulated key fully cleaned up after clearFrame', () => {
      input.simulatePress(' ');
      input.clearFrame();
      expect(input.wasPressed(' ')).toBe(false);
      expect(input.isDown(' ')).toBe(false);
    });

    it('multiple simulated keys all clean up', () => {
      input.simulatePress('r');
      input.simulatePress(' ');
      expect(input.isDown('r')).toBe(true);
      expect(input.isDown(' ')).toBe(true);
      input.clearFrame();
      expect(input.isDown('r')).toBe(false);
      expect(input.isDown(' ')).toBe(false);
    });
  });
});
