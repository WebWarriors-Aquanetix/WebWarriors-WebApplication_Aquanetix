import changePlanView from "./views/change-plan-view.vue";
import subscriptionView from "./views/subscription-view.vue";

const subscriptionsRoutes = [
    { path: '',     name: 'subscription-detail',  component: subscriptionView,    meta: { title: 'View Subscription' } },
    { path: 'change',              name: 'subscription-change-plan',           component: changePlanView,        meta: { title: 'Change Plan' } },
];

export default subscriptionsRoutes;