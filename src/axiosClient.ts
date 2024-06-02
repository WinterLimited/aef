// src/axiosClient.ts
import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:8080', // Replace with your actual API base URL
    withCredentials: true, // Include credentials (cookies) in requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Include session storage user info in the headers
axiosClient.interceptors.request.use(
    (config) => {
        const user = sessionStorage.getItem('user');
        if (user) {
            const parsedUser = JSON.parse(user);
            if (parsedUser && parsedUser.token) {
                config.headers['Authorization'] = `Bearer ${parsedUser.token}`; // Assuming the user object has a token property
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Handle response errors globally
axiosClient.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosClient;
