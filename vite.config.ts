import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/tank-game/' : '/',
  server: {
    allowedHosts: true,
  },
}));
