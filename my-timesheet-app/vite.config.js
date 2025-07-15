import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200, // Your frontend port
    proxy: {
      // CORRECT: This single rule will catch all your API calls
      // (e.g., /api/login, /api/projects, /api/timesheet/history)
      // and forward them to your backend.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});