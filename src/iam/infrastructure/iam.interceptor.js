/**
 * Adds the IAM bearer token to outbound requests when a user is authenticated.
 * Reads the token directly from localStorage to avoid Pinia reactivity pitfalls
 * and circular init (base-api is constructed before the store is active).
 *
 * @param {import('axios').InternalAxiosRequestConfig} config - Axios request configuration.
 * @returns {import('axios').InternalAxiosRequestConfig} Updated request configuration.
 */
export const iamInterceptor = (config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}
