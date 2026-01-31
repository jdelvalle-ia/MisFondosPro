import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Esto engaña al código para que crea que 'process.env' existe
      // sin necesidad de importar "process/browser"
      'process.env': {
        API_KEY: JSON.stringify(env.GEMINI_API_KEY || env.API_KEY || ''),
        NODE_ENV: JSON.stringify(mode),
      },
      // Esto soluciona errores de librerías que buscan el objeto global 'global'
      'global': 'window',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Si alguna librería sigue pidiendo 'process', la redirigimos a un objeto vacío o al shim
        'process': 'process/browser', 
      },
    },
    build: {
      rollupOptions: {
        // Si el error persiste, podemos decirle a Rollup que ignore 'process/browser'
        external: [], 
      },
    },
  };
});
