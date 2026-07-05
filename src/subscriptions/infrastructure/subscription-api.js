import { BaseApi } from '../../shared/infrastructure/base-api.js';
import { BaseEndpoint } from '../../shared/infrastructure/base-endpoint.js';

const subscriptionsPath = import.meta.env.VITE_SUBSCRIPTIONS_ENDPOINT_PATH ?? '/subscriptions';

/**
 * Infrastructure gateway for the Subscription bounded context.
 * Backend endpoints:
 *   GET  /subscriptions/plans        → plan catalog
 *   GET  /subscriptions/{id}         → one subscription
 *   POST /subscriptions              → create
 *   PUT  /subscriptions/{id}/cancel  → cancel
 *   PUT  /subscriptions/{id}/renew   → renew
 *   PUT  /subscriptions/{id}/plan    → change plan
 */
export class SubscriptionApi extends BaseApi {
    #endpoint;
    constructor() {
        super();
        this.#endpoint = new BaseEndpoint(this, subscriptionsPath);
    }

    getPlans()               { return this.http.get(`${subscriptionsPath}/plans`); }
    getSubscriptionById(id)  { return this.#endpoint.getById(id); }
    getSubscriptionByUserId(userId) { return this.http.get(`${subscriptionsPath}/by-user/${userId}`); }
    createSubscription(r)    { return this.#endpoint.create(r); }
    cancelSubscription(id)   { return this.http.put(`${subscriptionsPath}/${id}/cancel`); }
    renewSubscription(id)    { return this.http.put(`${subscriptionsPath}/${id}/renew`); }
    changePlan(id, newPlan)  { return this.http.put(`${subscriptionsPath}/${id}/plan`, { newPlan }); }
}
