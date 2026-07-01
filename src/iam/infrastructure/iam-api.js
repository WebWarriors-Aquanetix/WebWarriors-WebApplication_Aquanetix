import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";
import {BaseApi} from "../../shared/infrastructure/base-api.js";
const usersEndpointPath   = import.meta.env.VITE_USERS_ENDPOINT_PATH;
const signUpEndpointPath = import.meta.env.VITE_SIGNUP_ENDPOINT_PATH;

/**
 * Infrastructure gateway for IAM bounded-context endpoints.
 *
 * @class IamApi
 * @extends BaseApi
 */
export class IamApi extends BaseApi {
    #usersEndpoint;
    #signUpEndpoint;

    /** Creates endpoint clients for sign-in, sign-up, and user listing. */
    constructor() {
        super();
        this.#usersEndpoint = new BaseEndpoint(this, usersEndpointPath);
        this.#signUpEndpoint = new BaseEndpoint(this, signUpEndpointPath);
    }

    /**
     * Sends a sign-up command to the registration endpoint.
     * @param {import('../domain/sign-up.command.js').SignUpCommand} signUpRequest - Sign-up command.
     * @returns {Promise<import('axios').AxiosResponse<Object>>} HTTP response with registration payload.
     */
    signUp(signUpRequest) {
        return this.#signUpEndpoint.create(signUpRequest);
    }

    /**
     * Retrieves users visible to the IAM context.
     * @returns {Promise<import('axios').AxiosResponse<Array<Object>|Object>>} HTTP response with user resources.
     */
    getUsers() {
        return this.#usersEndpoint.getAll();
    }
}