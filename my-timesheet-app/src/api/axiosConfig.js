import axios from 'axios';

const api = axios.create({
  baseURL: '/api', 
  withCredentials: true,
});

// **IMPORTANT**: Add the base URL of your backend server to the API instance.
// When the frontend fetches an image, it needs the full URL.
// Example: http://localhost:3000/uploads/avatars/avatar-1.png
// NOTE: This assumes your backend runs on port 3000. Adjust if necessary.
api.defaults.baseURL = process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com/api' 
    : 'http://localhost:3000/api';

// We can also create a helper to get the server base for images
export const serverBaseUrl = process.env.NODE_ENV === 'production'
    ? 'https://your-production-domain.com'
    : 'http://localhost:3000';


export default api;