import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Cargamos las variables. En Vercel, 'process.cwd()' funciona durante el build.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Esta es la clave: inyectamos 'process.env' como un objeto global
      // para que tu código de AI Studio no explote al buscar 'process.env.API_KEY'
      'process.env': {
        API_KEY: JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        NODE_ENV: JSON.stringify(mode),
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      // Evita que el build falle por advertencias de TypeScript si las hay
      chunkSizeWarningLimit: 1600,
    },
  };
});
