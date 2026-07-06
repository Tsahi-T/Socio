import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The production build is a single self-contained index.html (scripts, styles
// and fonts inlined). This lets facilitators double-click the file offline
// (file://) and makes the same artifact work on GitHub Pages under any subpath.
// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
});
