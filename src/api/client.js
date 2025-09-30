import axios from 'axios';
import Cookies from 'js-cookie';

const apiClient = axios.create({
    baseURL: `${process.env.REACT_APP_API_URL}/v1`,
});

export const setAuthToken = token => {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

apiClient.interceptors.request.use(function (config) {
    return config;
});

export default apiClient;
