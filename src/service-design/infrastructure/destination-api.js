import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const destinationsPath = import.meta.env.VITE_DESTINATIONS_ENDPOINT_PATH ?? '/destinations';

/**
 * Infrastructure gateway for Destinations in the Service Design context.
 * Backend exposes GET all, GET {id}, POST, DELETE.
 */
export class DestinationApi extends BaseApi {
    #endpoint;
    constructor() {
        super();
        this.#endpoint = new BaseEndpoint(this, destinationsPath);
    }
    getDestinations()      { return this.#endpoint.getAll(); }
    getDestinationById(id) { return this.#endpoint.getById(id); }
    createDestination(r)   { return this.#endpoint.create(r); }
    deleteDestination(id)  { return this.#endpoint.delete(id); }
}
