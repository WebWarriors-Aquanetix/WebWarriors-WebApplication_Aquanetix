import { defineStore } from 'pinia';
import { ref } from 'vue';
import { SubscriptionApi } from '../infrastructure/subscription-api.js';
import { SubscriptionAssembler } from '../infrastructure/subscription.assembler.js';

const subscriptionApi = new SubscriptionApi();

const DEFAULT_SUBSCRIPTION_ID = import.meta.env.VITE_DEFAULT_SUBSCRIPTION_ID ?? '1';

/**
 * Store for the Subscription bounded context. Talks to the real backend:
 * plan catalog, current subscription, change plan, cancel, renew.
 */
const useSubscriptionStore = defineStore('subscription', () => {
    const subscription       = ref(null);
    const plans              = ref([]);
    const subscriptionLoaded = ref(false);
    const plansLoaded        = ref(false);
    const errors             = ref([]);

    function fetchPlans() {
        errors.value = [];
        return subscriptionApi.getPlans()
            .then(response => {
                plans.value = SubscriptionAssembler.toPlansFromResponse(response);
                plansLoaded.value = true;
            })
            .catch(error => { errors.value.push(error); plansLoaded.value = true; });
    }

    function fetchSubscription(id = null) {
        // Use the logged-in user's id (set by IAM on login) to fetch THEIR subscription.
        const userId = Number(localStorage.getItem('userId') || 0);
        if (userId > 0) {
            errors.value = [];
            return subscriptionApi.getSubscriptionByUserId(userId)
                .then(response => {
                    subscription.value = SubscriptionAssembler.toEntityFromResource(response.data);
                    subscriptionLoaded.value = true;
                })
                .catch(error => {
                    if (error?.response?.status !== 404) errors.value.push(error);
                    subscription.value = null;
                    subscriptionLoaded.value = true;
                });
        }
        return fetchSubscriptionById(id ?? DEFAULT_SUBSCRIPTION_ID);
    }

    function fetchSubscriptionById(id = DEFAULT_SUBSCRIPTION_ID) {
        errors.value = [];
        return subscriptionApi.getSubscriptionById(id)
            .then(response => {
                subscription.value = SubscriptionAssembler.toEntityFromResource(response.data);
                subscriptionLoaded.value = true;
            })
            .catch(error => {
                // A 404 means there is no subscription yet — a valid state, not an error.
                if (error?.response?.status !== 404) errors.value.push(error);
                subscription.value = null;
                subscriptionLoaded.value = true;
            });
    }

    function changePlan(newPlanName) {
        const id = subscription.value?.id ?? DEFAULT_SUBSCRIPTION_ID;
        errors.value = [];
        return subscriptionApi.changePlan(id, newPlanName)
            .then(response => {
                subscription.value = SubscriptionAssembler.toEntityFromResource(response.data);
                return subscription.value;
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    function cancelSubscription() {
        const id = subscription.value?.id ?? DEFAULT_SUBSCRIPTION_ID;
        errors.value = [];
        return subscriptionApi.cancelSubscription(id)
            .then(response => {
                subscription.value = SubscriptionAssembler.toEntityFromResource(response.data);
                return subscription.value;
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    function renewSubscription() {
        const id = subscription.value?.id ?? DEFAULT_SUBSCRIPTION_ID;
        errors.value = [];
        return subscriptionApi.renewSubscription(id)
            .then(response => {
                subscription.value = SubscriptionAssembler.toEntityFromResource(response.data);
                return subscription.value;
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    return {
        subscription, plans, subscriptionLoaded, plansLoaded, errors,
        fetchPlans, fetchSubscription, changePlan, cancelSubscription, renewSubscription,
    };
});

export default useSubscriptionStore;
