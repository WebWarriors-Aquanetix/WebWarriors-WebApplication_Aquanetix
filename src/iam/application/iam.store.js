/**
 * Application service store for the IAM bounded context.
 * @module useIamStore
 */
import { IamApi } from "../infrastructure/iam-api.js";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { SignInAssembler } from "../infrastructure/sign-in.assembler.js";

const iamApi = new IamApi();

const useIamStore = defineStore('iam', () => {
    const errors = ref([]);
    const isSignedIn = ref(!!localStorage.getItem('token'));
    const currentEmail = ref(localStorage.getItem('email') || null);
    const currentUserId = ref(Number(localStorage.getItem('userId') || 0));
    const currentToken = computed(() => localStorage.getItem('token'));

    /** Persist the authenticated session (from sign-in OR sign-up). */
    function persistSession(resource) {
        currentEmail.value = resource.email;
        currentUserId.value = resource.id;
        localStorage.setItem('token', resource.token);
        localStorage.setItem('email', resource.email ?? '');
        localStorage.setItem('userId', String(resource.id ?? 0));
        isSignedIn.value = true;
        errors.value = [];
    }

    function signIn(signInCommand, router) {
        iamApi.signIn(signInCommand)
            .then(response => {
                const resource = SignInAssembler.toResourceFromResponse(response);
                if (resource && resource.token) {
                    persistSession(resource);
                    router.push({ name: 'dashboard-view' });
                } else {
                    isSignedIn.value = false;
                    errors.value.push(new Error('Sign-in failed'));
                }
            })
            .catch(error => {
                isSignedIn.value = false;
                errors.value.push(error);
            });
    }

    function signUp(signUpCommand, router) {
        iamApi.signUp(signUpCommand)
            .then(response => {
                // Backend now returns { id, email, role, token } (auto-login).
                const resource = SignInAssembler.toResourceFromResponse(response);
                if (resource && resource.token) {
                    persistSession(resource);        // auto-login after sign-up
                    router.push({ name: 'dashboard-view' });
                } else {
                    errors.value.push(new Error('Sign-up failed'));
                    router.push({ name: 'iam-sign-in' });
                }
            })
            .catch(error => {
                // Show the backend message (e.g. invalid plan / email exists).
                const msg = error?.response?.data?.message || 'Sign-up failed';
                errors.value.push(new Error(msg));
            });
    }

    function signOut(router) {
        currentEmail.value = null;
        currentUserId.value = 0;
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('userId');
        isSignedIn.value = false;
        errors.value = [];
        if (router) router.push({ name: 'iam-sign-in' });
    }

    return {
        errors, isSignedIn, currentEmail, currentUserId, currentToken,
        signIn, signUp, signOut
    };
});

export default useIamStore;
