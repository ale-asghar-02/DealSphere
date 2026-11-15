import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from './tokenManager';

export const api = axios.create({
    baseURL: import.meta.env.VITE_SERVER_URL,
    withCredentials: true
});

// ── Request Interceptor: har request ke sath access token attach karo ──
api.interceptors.request.use((config) => {
    const token = getAccessToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const register = async ({ username, email, password, accountType })=> {
    const response = await api.post('/auth/user/register', { username, email, password, accountType })
    return response.data
}

export const login = async ({ email, password })=> {
    const response = await api.post('/auth/user/login', { email, password })
    if (response.data.accessToken) setAccessToken(response.data.accessToken);
    return response.data
}

export const logout = async ()=> {
    const response = await api.post('/auth/user/logout')
    clearAccessToken();
    return response.data
}

export const logoutAllDevices = async ()=> {
    const response = await api.post('/auth/user/logout/all-devices')
    clearAccessToken();
    return response.data
}

export const sendOtpVerify = async ({ email })=> {
    const response = await api.post('/auth/user/send-verify-otp', { email })
    return response.data
}

export const verifyAccount = async ({ email, otp })=> {
    const response = await api.post('/auth/user/verify-account', { email, otp })
    if (response.data.accessToken) setAccessToken(response.data.accessToken);
    return response.data
}

export const resetOtp = async ({ email })=> {
    const response = await api.post('/auth/user/reset-otp', { email })
    return response.data
}

export const verifyResetOtp = async ({ email, otp })=> {
    const response = await api.post('/auth/user/verify-reset-otp', { email, otp })
    return response.data
}

export const forgotPassword = async ({ newPassword, confirmPassword })=> {
    const response = await api.post('/auth/user/forgot-password', { newPassword, confirmPassword })
    return response.data
}

export const getGoogleAuthUrl = () => {
    return `${import.meta.env.VITE_SERVER_URL}/auth/user/google`
}

// naya export — app load hote waqt bootstrap ke liye chahiye hoga (Step 3 dekhein)
export const refreshAccessToken = async () => {
    const response = await api.post('/auth/user/refresh-token');
    if (response.data.accessToken) setAccessToken(response.data.accessToken);
    return response.data;
}

// ── Refresh Token Queue Handling ─────────────────────────────────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 &&
            !originalRequest._retry &&
            !originalRequest.url.includes('/refresh-token') &&
            !originalRequest.url.includes('/login')) {

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then(() => api(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await refreshAccessToken(); // naya accessToken store bhi kar dega
                processQueue(null);
                return api(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError);
                clearAccessToken();
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);