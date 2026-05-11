import axios from 'axios';

const platformApi = import.meta.env.VITE_AQUANETIX_API_URL;

/**
 * Base infrastructure class that creates and exposes a pre-configured Axios instance.
 * All bounded-context API gateways extend this class.
 *
 * @class BaseApi
 */
export class BaseApi {
    #http;

    constructor() {
        this.#http = axios.create({
            baseURL: platformApi,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    get http() {
        return this.#http;
    }
}
