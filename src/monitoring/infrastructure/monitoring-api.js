import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const sensorsPath      = import.meta.env.VITE_SENSORS_ENDPOINT_PATH;
const alertsPath       = import.meta.env.VITE_ALERTS_ENDPOINT_PATH;
const subscriptionPath = import.meta.env.VITE_SUBSCRIPTION_ENDPOINT_PATH;
const plansPath        = import.meta.env.VITE_PLANS_ENDPOINT_PATH;

/**
 * Infrastructure gateway for the Monitoring bounded-context endpoints.
 * @class MonitoringApi
 */
export class MonitoringApi extends BaseApi {
    #sensorsEndpoint;
    #alertsEndpoint;
    #subscriptionEndpoint;
    #plansEndpoint;

    constructor() {
        super();
        this.#sensorsEndpoint      = new BaseEndpoint(this, sensorsPath);
        this.#alertsEndpoint       = new BaseEndpoint(this, alertsPath);

        const subscriptionApi      = new BaseApi(import.meta.env.VITE_SUBSCRIPTION_API_URL);
        this.#subscriptionEndpoint = new BaseEndpoint(subscriptionApi, subscriptionPath);
        this.#plansEndpoint        = new BaseEndpoint(subscriptionApi, plansPath);
    }

    // --- Sensors ---
    getSensors()      { return this.#sensorsEndpoint.getAll(); }
    getSensorById(id) { return this.#sensorsEndpoint.getById(id); }
    createSensor(r)   { return this.#sensorsEndpoint.create(r); }
    updateSensor(r)   { return this.#sensorsEndpoint.update(r.id, r); }
    deleteSensor(id)  { return this.#sensorsEndpoint.delete(id); }

    // --- Alerts ---
    getAlerts()       { return this.#alertsEndpoint.getAll(); }
    getAlertById(id)  { return this.#alertsEndpoint.getById(id); }
    createAlert(r)    { return this.#alertsEndpoint.create(r); }
    updateAlert(r)    { return this.#alertsEndpoint.update(r.id, r); }
    deleteAlert(id)   { return this.#alertsEndpoint.delete(id); }

    // --- Subscription ---
    getSubscription()   { return this.#subscriptionEndpoint.getAll(); }
    updateSubscription(id, r) { return this.#subscriptionEndpoint.http.put(`${subscriptionPath}/${id}`, r); }

    // --- Plans ---
    getPlans()          { return this.#plansEndpoint.getAll(); }
}