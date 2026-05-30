import { createRouter, createWebHistory } from 'vue-router';
import monitoringRoutes from './monitoring/presentation/monitoring-routes.js';
import dashboardView from "./dashboard/presentation/views/dashboard-view.vue";
import sensorList from "./devices/presentation/views/sensor-list.vue";
import sensorForm from "./devices/presentation/views/sensor-form.vue";
import sensorDetail from "./devices/presentation/views/sensor-detail.vue";

const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

const routes = [
    { path: '/dashboard', component: dashboardView, meta: { title: 'Dashboard' } },
    { path: '/sensors',             name: 'monitoring-sensors',          component: sensorList,       meta: { title: 'Sensors' } },
    { path: '/sensors/new',         name: 'monitoring-sensor-new',       component: sensorForm,       meta: { title: 'New Sensor' } },
    { path: '/sensors/:id/edit',    name: 'monitoring-sensor-edit',      component: sensorForm,       meta: { title: 'Edit Sensor' } },
    { path: '/sensors/:id',         name: 'monitoring-sensor-detail',    component: sensorDetail,     meta: { title: 'Sensor Detail' } },
    { path: '/monitoring', name: 'monitoring', children: monitoringRoutes },
    { path: '/',           redirect: '/dashboard' },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: pageNotFound, meta: { title: 'Page Not Found' } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

router.beforeEach((to, from, next) => {
    const baseTitle = 'Aquanetix';
    document.title = `${baseTitle} - ${to.meta['title'] || 'App'}`;
    return next();
});

export default router;
