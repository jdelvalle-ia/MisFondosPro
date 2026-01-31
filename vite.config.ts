import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ESM as it is not available by default in Node.js ESM modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // Use path.resolve() instead of process.cwd() to resolve the "Property 'cwd' does not exist on type 'Process'" error
  //const env = loadEnv(mode, path.resolve(), '');
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Priorizamos GEMINI_API_KEY (de tu Netlify) y la mapeamos a la variable que espera el código
      //'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || env.API_KEY || '')
      'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
        // Forzamos la variable global
      'globalThis.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      'window.__DEBUG_API_KEY__': JSON.stringify(env.VITE_GEMINI_API_KEY || "NO_DETECTADA_EN_BUILD")
    },
    resolve: {
      alias: {
        // Use the manually defined __dirname to fix the "Cannot find name '__dirname'" error
        '@': path.resolve(__dirname, './'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    build: {
      outDir: 'dist',
      sourcemap: true
    }
  };
});
