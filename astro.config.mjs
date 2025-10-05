import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  'srcDir': 'client/src',
  'publicDir': 'client/public',
  'root': './',

  vite: {
    plugins: [tailwindcss()],
  },
});