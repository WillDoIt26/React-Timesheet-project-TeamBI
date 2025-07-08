// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4200, // We'll run the React app on 4200 to match your backend CORS
    proxy: {
      // Proxy API requests to the backend server
      '/login': 'http://localhost:3000',
      '/logout': 'http://localhost:3000',
      '/register': 'http://localhost:3000',
      '/create-user': 'http://localhost:3000',
      '/user': 'http://localhost:3000',
      '/timesheet': 'http://localhost:3000',
      '/projects': 'http://localhost:3000',
    },
  },
});