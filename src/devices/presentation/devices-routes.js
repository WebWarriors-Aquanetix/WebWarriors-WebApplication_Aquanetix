/**
 * Lazy-loaded route definitions for the Devices bounded context.
 * Registered as children of the `/devices` route in the application router.
 *
 * @module devicesRoutes
 */
const deviceDetail = () => import('./views/device-detail.vue');
const deviceForm = () => import('./views/device-form.vue');
const deviceList = () => import('./views/device-list.vue');

const devicesRoutes = [
    { path: '',            name: 'devices-list',          component: deviceList,       meta: { title: 'Devices' } },
    { path: 'new',         name: 'devices-new',       component: deviceForm,       meta: { title: 'New Device' } },
    { path: ':id/edit',    name: 'devices-edit',      component: deviceForm,       meta: { title: 'Edit Device' } },
    { path: ':id',         name: 'devices-detail',    component: deviceDetail,     meta: { title: 'Device Detail' } },
];

export default devicesRoutes;