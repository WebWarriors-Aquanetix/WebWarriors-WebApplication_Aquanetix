/**
 * Lazy-loaded route definitions for the Monitoring bounded context.
 * Registered as children of the `/monitoring` route in the application router.
 * Follows the same pattern as publishing-routes.js from the learning-center.
 *
 * @module monitoringRoutes
 */
const dashboardView    = () => import('./views/dashboard-view.vue');
const sensorList       = () => import('./views/sensor-list.vue');
const sensorForm       = () => import('./views/sensor-form.vue');
const sensorDetail     = () => import('./views/sensor-detail.vue');
const alertList        = () => import('./views/alert-list.vue');
const alertResolved    = () => import('./views/alert-resolved.vue');
const subscriptionView = () => import('./views/subscription-view.vue');
const changePlanView   = () => import('./views/change-plan-view.vue');

const monitoringRoutes = [
    { path: 'dashboard',           name: 'monitoring-dashboard',        component: dashboardView,    meta: { title: 'Dashboard' } },
    { path: 'sensors',             name: 'monitoring-sensors',          component: sensorList,       meta: { title: 'Sensors' } },
    { path: 'sensors/new',         name: 'monitoring-sensor-new',       component: sensorForm,       meta: { title: 'New Sensor' } },
    { path: 'sensors/:id/edit',    name: 'monitoring-sensor-edit',      component: sensorForm,       meta: { title: 'Edit Sensor' } },
    { path: 'sensors/:id',         name: 'monitoring-sensor-detail',    component: sensorDetail,     meta: { title: 'Sensor Detail' } },
    { path: 'alerts',              name: 'monitoring-alerts',           component: alertList,        meta: { title: 'Alerts' } },
    { path: 'alerts/resolved',     name: 'monitoring-alerts-resolved',  component: alertResolved,    meta: { title: 'Alert History' } },
    { path: 'subscription',        name: 'monitoring-subscription',     component: subscriptionView, meta: { title: 'Subscription' } },
    { path: 'subscription/change',  name: 'monitoring-change-plan',      component: changePlanView,   meta: { title: 'Change Plan' } },
];

export default monitoringRoutes;