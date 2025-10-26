// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://tsm.apenalba.me',
  base: '/',
  output: 'server',
  adapter: vercel(),
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [react()]
});