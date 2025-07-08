// src/api/axiosConfig.js
import axios from 'axios';

const api = axios.create({
  // The proxy in vite.config.js handles the base URL,
  // so we can use relative paths here.
  // baseURL: 'http://localhost:3000', 
  withCredentials: true, // IMPORTANT: This allows cookies to be sent with requests
});

// This is the crucial line. Make sure it says "export default".
export default api; 