import axios from 'axios';
import { API_BASE } from 'utils/constants';

const http = axios.create({ baseURL: API_BASE, withCredentials: true });

export const TOKEN_KEY = 'accessToken';

export const setAuthToken = (token) => {
    try {
        if (token) localStorage.setItem(TOKEN_KEY, token);
        else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
        /* storage blocked */
    }
    if (token) http.defaults.headers.common.Authorization = `Bearer ${token}`;
    else delete http.defaults.headers.common.Authorization;
};

export const getStoredToken = () => {
    try {
        return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
        return null;
    }
};

// all callers share one refresh request, so parallel 401s don't each hit /auth
let refreshing = null;
export const refreshAccessToken = () => {
    if (!refreshing) {
        refreshing = axios
            .get(`${API_BASE}auth`, { withCredentials: true })
            .then((res) => {
                const token = res?.data?.data?.[0]?.accessToken;
                if (!token) throw new Error('No token returned');
                setAuthToken(token);
                return token;
            })
            .finally(() => {
                refreshing = null;
            });
    }
    return refreshing;
};

http.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        const type = error.response?.headers?.['x-server-errortype'];

        if (type === 'AccessTokenExpired' && original && !original._retried) {
            original._retried = true;
            try {
                const token = await refreshAccessToken();
                original.headers.Authorization = `Bearer ${token}`;
                return http(original);
            } catch (e) {
                setAuthToken(null);
                window.dispatchEvent(new Event('auth:expired'));
            }
        }

        const message = error.response ? error.response.data?.message || `Request failed (${error.response.status})` : 'Cannot reach the server. Check your connection.';
        const err = new Error(message);
        err.status = error.response?.status;
        return Promise.reject(err);
    }
);

export default http;
