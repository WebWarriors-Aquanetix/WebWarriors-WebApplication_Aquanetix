import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";
import {BaseApi} from "../../shared/infrastructure/base-api.js";
const usersEndpointPath   = import.meta.env.VITE_USERS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for IAM bounded-context endpoints.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    #usersEndpoint;

    /** Creates endpoint clients for sign-in, sign-up, and user listing. */
    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
    }
    /**
     * Retrieves users visible to the IAM context.
     * @returns {Promise<import('axios').AxiosResponse<Array<Object>|Object>>} HTTP response with user resources.
     */
    getUsers() {
        return this.#usersEndpoint.getAll();
    }
}