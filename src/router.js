import { createRouter, createWebHistory } from 'vue-router';
import monitoringRoutes from './monitoring/presentation/monitoring-routes.js';
import dashboardView from "./dashboard/presentation/views/dashboard-view.vue";
import devicesRoutes from "./devices/presentation/devices-routes.js";

const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

const routes = [
    { path: '/dashboard', component: dashboardView, meta: { title: 'Dashboard' } },
    { path: '/devices', name: 'devices', children: devicesRoutes },
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
