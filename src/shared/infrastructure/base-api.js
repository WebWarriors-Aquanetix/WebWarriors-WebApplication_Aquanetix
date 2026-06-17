import axios from 'axios';

const platformApi = import.meta.env.VITE_AQUANETIX_API_URL;

/**
 * Base infrastructure class that creates and exposes a pre-configured Axios instance.
 * Accepts an optional baseURL to support multiple MockAPI accounts.
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
    }

    get http() {
        return this.#http;
    }
}