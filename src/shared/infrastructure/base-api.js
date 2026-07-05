import axios from 'axios';
import { iamInterceptor } from '../../iam/infrastructure/iam.interceptor.js';

const platformApi = import.meta.env.VITE_AQUANETIX_API_URL;

/**
 * Base infrastructure class that creates and exposes a pre-configured Axios instance.
 * The IAM interceptor attaches the Bearer token to every outbound request.
 *
 * @class BaseApi
 */
export class BaseApi {
    #http;

    constructor(baseURL = platformApi) {
        this.#http = axios.create({
            baseURL,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        // Attach the JWT to every request when the user is authenticated.
        this.#http.interceptors.request.use(iamInterceptor);
    }

    get http() {
        return this.#http;
    }
}
