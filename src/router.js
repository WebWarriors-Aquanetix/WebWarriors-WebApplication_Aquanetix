import { createRouter, createWebHistory } from 'vue-router';
import monitoringRoutes from './monitoring/presentation/monitoring-routes.js';
import devicesRoutes from "./devices/presentation/devices-routes.js";
import dashboardRoutes from "./dashboard/presentation/dashboard-routes.js";
import subscriptionsRoutes from "./subscriptions/presentation/subscriptions-routes.js";

const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

const routes = [
    { path: '/devices', name: 'devices', children: devicesRoutes },
    { path: '/dashboard', name: 'dashboard', children: dashboardRoutes },
    { path: '/monitoring', name: 'monitoring', children: monitoringRoutes },
    { path: '/subscription', name: 'subscription', children: subscriptionsRoutes},
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
