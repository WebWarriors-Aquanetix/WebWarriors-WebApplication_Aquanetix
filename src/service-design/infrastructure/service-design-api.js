import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

/**
 * Endpoint path for the Service Design / Water Batches context.
 * Backend route is `api/v1/water-batches` (kebab-case is produced by the backend's
 * KebabCaseRouteNamingConvention, so the value in .env is already correct).
 */
const waterBatchesPath = import.meta.env.VITE_WATER_BATCHES_ENDPOINT_PATH ?? '/water-batches';

/**
 * Infrastructure gateway for the Service Design bounded context.
 * Talks to the real ASP.NET Core backend. The WaterBatches controller exposes a
 * full CRUD (GET all, GET {id}, POST, PUT {id}, DELETE {id}).
 *
 * @class ServiceDesignApi
 */
export class ServiceDesignApi extends BaseApi {
    #waterBatchesEndpoint;

    constructor() {
        super();
        this.#waterBatchesEndpoint = new BaseEndpoint(this, waterBatchesPath);
    }

    getWaterBatches()        { return this.#waterBatchesEndpoint.getAll(); }
    getWaterBatchById(id)    { return this.#waterBatchesEndpoint.getById(id); }
    createWaterBatch(r)      { return this.#waterBatchesEndpoint.create(r); }
    updateWaterBatch(id, r)  { return this.#waterBatchesEndpoint.update(id, r); }
    deleteWaterBatch(id)     { return this.#waterBatchesEndpoint.delete(id); }
}
