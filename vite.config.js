import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import purge from 'vite-plugin-purgecss'; // Correct import

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  return {
    plugins: [
      react(),

      // PurgeCSS: Only in production
      isProduction && purge({
        // Scan these files for used classes
        content: [
          './index.html',
          './src/**/*.{js,jsx,ts,tsx,html}',
        ],
        // Keep these classes even if "unused" (your app's patterns)
        safelist: [
          /^react-/,
          /^swiper-/,
          /^toast-/,
          /^modal-/,
          /^btn-/,
          /^product-/,
          /^order-/,
          /^action-/,
          /^image-/,
          /^date-/,
          'product-grid',
          'product-grid-2',
          'product-grid-3',
          'product-card',
          'load-more-button',
          'continue-shopping-btn',
          'modal-overlay',
          'modal',
          'modal-btn',
          'danger',
          'cancel',
          'accordion',
          'accordion-header',
          'accordion-content',
          'arrow',
          'open',
          'table-action-buttons',
          'action-btn',
          'view',
          'delete',
        ],
        // Allow purging of keyframes and @font-face
        keyframes: true,
        fontFace: true,
      }),
    ].filter(Boolean), // Remove falsy values

    build: {
      sourcemap: true, // Keep source maps
      cssCodeSplit: false, // One CSS file
      rollupOptions: {
        output: {
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === 'main.css' || assetInfo.name?.endsWith('.css')) {
              return 'styles/main.css';
            }
            return 'assets/[name].[hash][extname]';
          },
        },
      },
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
  };
});