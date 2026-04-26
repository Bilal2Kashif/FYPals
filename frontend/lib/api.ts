import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach JWT to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Unwrap { success, data, message } and handle 401 → silent refresh → redirect
api.interceptors.response.use(
    (res) => {
      // Unwrap the backend ApiResponse wrapper so callers receive data directly
      if (res.data && typeof res.data === 'object' && 'data' in res.data) {
        return res.data.data;
      }
      return res.data;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Send the expired access token as the refresh credential.
          // The backend's AuthService.refreshToken() uses extractEmailIgnoreExpiry()
          // to re-issue a new token even from an expired one.
          const oldToken =
              typeof window !== 'undefined' ? localStorage.getItem('token') : null;

          if (!oldToken) throw new Error('No token stored');

          const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
              { token: oldToken }
          );

          // Handle both wrapped { success, data: { token } } and plain { token }
          const payload = response.data?.data ?? response.data;
          const newToken = payload?.token ?? payload;

          if (newToken && typeof newToken === 'string') {
            localStorage.setItem('token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return api(originalRequest);
          }

          throw new Error('No token in refresh response');
        } catch {
          // Refresh failed — clear auth and send user to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            // Clear persisted Zustand store so isAuthenticated resets
            localStorage.removeItem('fypals-auth');
            window.location.href = '/auth/login';
          }
        }
      }

      return Promise.reject(error);
    }
);

export default api;