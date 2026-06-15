const serviceList   = () => import('./views/service-design-list.vue');

const serviceDesignRoutes = [
  {
    path: '', name: 'service-list', component: serviceList(), meta: { title: 'Services' },
  },
];

export default serviceDesignRoutes;