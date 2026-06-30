/**
 * Lazy-loaded route definitions for the Service Design (Water Batches) bounded context.
 * Registered as children of the `/service-design` route in the application router.
 *
 * @module serviceDesignRoutes
 */
const waterBatchList = () => import('./views/water-batch-list.vue');
const waterBatchForm = () => import('./views/water-batch-form.vue');

const serviceDesignRoutes = [
    { path: '',         name: 'water-batches-list',  component: waterBatchList, meta: { title: 'Water Batches' } },
    { path: 'new',      name: 'water-batches-new',   component: waterBatchForm, meta: { title: 'New Water Batch' } },
    { path: ':id/edit', name: 'water-batches-edit',  component: waterBatchForm, meta: { title: 'Edit Water Batch' } },
];

export default serviceDesignRoutes;
