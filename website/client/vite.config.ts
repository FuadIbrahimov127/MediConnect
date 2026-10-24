import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// /v1 və /__dev sorğuları lokal mock serverə yönləndirilir. Real backend üçün VITE_API_BASE_URL təyin et.
const target = process.env.MOCK_API_URL ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/v1': { target, changeOrigin: true },
      '/__dev': { target, changeOrigin: true },
    },
  },
});
