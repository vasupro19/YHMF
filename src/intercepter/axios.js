/**
 * axios setup to use mock service
 */

import axios from 'axios';
// 'http://127.0.0.1:9081/v1/'
const axiosServices = axios.create({
    baseURL: process.env.REACT_APP_BACKEND_SERVER || 'http://127.0.0.1:0131/v1/',
    withCredentials: true
});

// // interceptor for http
// axiosServices.interceptors.response.use(
//     (response) => response,
//     (error) => Promise.reject((error.response && error.response.data) || 'Wrong Services ~-> Server Not Started')
// );

let isRefreshing = false;

axiosServices.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (error.response.headers['x-server-errortype'] === 'AccessTokenExpired' && !originalRequest.retry) {
            // Check if a refresh is already in progress
            if (!isRefreshing) {
                isRefreshing = true;
                try {
                    const accessToken = await axiosServices.get('/auth');
                    const newToken = accessToken?.data?.data?.[0]?.accessToken;
                    axiosServices.defaults.headers.common.Authorization = `Bearer ${newToken}`;
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                    originalRequest.retry = true;
                    localStorage.setItem('accessToken', newToken);
                    return axiosServices(originalRequest);
                } catch (refreshError) {
                    console.error('Access token refresh failed', refreshError);
                } finally {
                    isRefreshing = false;
                }
            }
            if (!originalRequest.retry) {
                return Promise.reject(error.response.data);
            }
        }

        return Promise.reject((error.response && error.response.data) || 'Wrong Services ~-> Server Not Started');
    }
);
export default axiosServices;
