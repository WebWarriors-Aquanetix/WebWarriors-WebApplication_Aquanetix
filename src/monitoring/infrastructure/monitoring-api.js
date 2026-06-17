import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const devicesPath       = import.meta.env.VITE_DEVICES_ENDPOINT_PATH       ?? '/devices';
const alertsPath        = import.meta.env.VITE_ALERTS_ENDPOINT_PATH        ?? '/alerts';
const subscriptionsPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH ?? '/subscriptions';

/**
 * Infrastructure gateway for the real Aquanetix backend (Devices + Monitoring + Subscription).
 * Talks to the ASP.NET Core API deployed on Render.
 * @class MonitoringApi
 */
export class MonitoringApi extends BaseApi {
    #devicesEndpoint;
    #alertsEndpoint;
    #subscriptionsEndpoint;

    constructor() {
        super();
        this.#devicesEndpoint       = new BaseEndpoint(this, devicesPath);
        this.#alertsEndpoint        = new BaseEndpoint(this, alertsPath);
        this.#subscriptionsEndpoint = new BaseEndpoint(this, subscriptionsPath);
    }

    // --- Devices (mapeados al modelo "Sensor" de la UI por el assembler) ---
    getSensors()      { return this.#devicesEndpoint.getAll(); }
    getSensorById(id) { return this.#devicesEndpoint.getById(id); }
    createSensor(r)   { return this.#devicesEndpoint.create(r); }
    updateSensor(r)   { return this.#devicesEndpoint.update(r.id, r); }
    deleteSensor(id)  { return this.#devicesEndpoint.delete(id); }

    // --- Thresholds (sub-recurso de un device) ---
    getThresholds(deviceId)      { return this.http.get(`${devicesPath}/${deviceId}/thresholds`); }
    createThreshold(deviceId, r) { return this.http.post(`${devicesPath}/${deviceId}/thresholds`, r); }

    // --- Alerts ---
    getAlerts()       { return this.#alertsEndpoint.getAll(); }
    getAlertById(id)  { return this.#alertsEndpoint.getById(id); }
    createAlert(r)    { return this.#alertsEndpoint.create(r); }
    updateAlert(r)    { return this.#alertsEndpoint.update(r.id, r); }
    deleteAlert(id)   { return this.#alertsEndpoint.delete(id); }

    // --- Subscription (el backend expone GET /subscriptions/{id}) ---
    getSubscriptionById(id)   { return this.#subscriptionsEndpoint.getById(id); }
    createSubscription(r)     { return this.#subscriptionsEndpoint.create(r); }
    cancelSubscription(id)    { return this.http.put(`${subscriptionsPath}/${id}/cancel`); }
    renewSubscription(id)     { return this.http.put(`${subscriptionsPath}/${id}/renew`); }
}
