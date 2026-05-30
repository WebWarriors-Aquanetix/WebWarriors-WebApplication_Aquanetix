/**
 * Lazy-loaded route definitions for the Monitoring bounded context.
 * Registered as children of the `/monitoring` route in the application router.
 * Follows the same pattern as publishing-routes.js from the learning-center.
 *
 * @module monitoringRoutes
 */
const alertList        = () => import('./views/alert-list.vue');
const alertResolved    = () => import('./views/alert-resolved.vue');
const subscriptionView = () => import('./views/subscription-view.vue');
const changePlanView   = () => import('./views/change-plan-view.vue');

const monitoringRoutes = [
    { path: 'alerts',              name: 'monitoring-alerts',           component: alertList,        meta: { title: 'Alerts' } },
    { path: 'alerts/resolved',     name: 'monitoring-alerts-resolved',  component: alertResolved,    meta: { title: 'Alert History' } },
    { path: 'subscription',        name: 'monitoring-subscription',     component: subscriptionView, meta: { title: 'Subscription' } },
    { path: 'subscription/change',  name: 'monitoring-change-plan',      component: changePlanView,   meta: { title: 'Change Plan' } },
];

export default monitoringRoutes;