// @ts-check
import { defineConfig, envField } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  // Site stays static by default; the tutor endpoint opts out with
  // `export const prerender = false`.
  adapter: vercel(),

  env: {
    schema: {
      // Optional so `astro build` succeeds without a key present; the API
      // route checks for it at request time and returns a clear error.
      ANTHROPIC_API_KEY: envField.string({
        context: 'server',
        access: 'secret',
        optional: true,
      }),
    },
  },

  vite: {
    plugins: [tailwindcss()],
  },

  integrations: [react()],
});