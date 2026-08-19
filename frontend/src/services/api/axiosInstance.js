import axios from 'axios';

// Create base instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  timeout: 10000, // 10 seconds
});

// Request Interceptor: Attach token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const requestUrl = error.config?.url || '';

      // Global 401 handling — only redirect if:
      // 1. It's actually a 401 (not 403/404)
      // 2. We're NOT on the login page already
      // 3. The failing request was NOT the login endpoint itself
      if (
        status === 401 &&
        window.location.pathname !== '/login' &&
        !requestUrl.includes('/auth/login')
      ) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
