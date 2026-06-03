import dashboardView from "./views/dashboard-view.vue";

const dashboardRoutes = [
    { path: '',             name: 'dashboard-view',          component: dashboardView,       meta: { title: 'Dashboard' } },
];

export default dashboardRoutes;