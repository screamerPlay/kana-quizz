import { defineConfig } from 'vite';

// No React plugin needed: esbuild compiles JSX with the automatic runtime.
// base './' makes the build work on any GitHub Pages path (user or project site).
export default defineConfig({
  base: './',
  esbuild: { jsx: 'automatic' },
});
