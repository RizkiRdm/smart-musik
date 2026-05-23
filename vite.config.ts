import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { viteCommonjs } from '@originjs/vite-plugin-commonjs';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteCommonjs()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'long': path.resolve(__dirname, 'node_modules/@tensorflow/tfjs-core/node_modules/long/dist/long.js'),
        './tflite_web_api_client': path.resolve(__dirname, 'node_modules/@tensorflow/tfjs-tflite/wasm/tflite_web_api_client.js'),
        '../tflite_web_api_client': path.resolve(__dirname, 'node_modules/@tensorflow/tfjs-tflite/wasm/tflite_web_api_client.js'),
      },
    },
    optimizeDeps: {
      exclude: ['sql.js', '@tensorflow/tfjs-tflite'],
    },
    build: {
      target: 'esnext',
    },
    server: {
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
