/**
 * Lazy-loaded route definitions for the IAM bounded context.
 * Registered as children of the `/iam` route in the application router.
 *
 * @module iamRoutes
 */
const signInForm = () => import('./views/sign-in-form.vue')
const signUpForm = () => import('./views/sign-up-form.vue')
const iamRoutes = [

    { path: 'sign-in', name: 'iam-sign-in', component: signInForm, meta: { title: 'Sign-In' } },
    { path: 'sign-up', name: 'iam-sign-up', component: signUpForm, meta: { title: 'Sign-Up' } }
];

export default iamRoutes;