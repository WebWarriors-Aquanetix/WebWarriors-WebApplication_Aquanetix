/**
 * Application service store for the IAM bounded context.
 * It coordinates authentication commands and exposes UI-facing auth state.
 *
 * @module useIamStore
 */
import {IamApi} from "../infrastructure/iam-api.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {SignUpAssembler} from "../infrastructure/sign-up.assembler.js";
import {UserAssembler} from "../infrastructure/user.assembler.js";
import {SignUpCommand} from "../domain/sign-up.command.js";
import {SignInAssembler} from "../infrastructure/sign-in.assembler.js";
import {SignInCommand} from "../domain/sign-in.command.js";
const iamApi = new IamApi();

/**
 * Reactive store that exposes IAM commands and authentication state.
 *
 * @returns {Object} Store state and actions.
 */
const useIamStore = defineStore('iam', () => {
    /** @type {import('vue').Ref<import('../domain/user.entity.js').User[]>} List of user entities loaded from infrastructure. */
    const users = ref([]);
    /** @type {import('vue').Ref<Error[]>} Errors encountered during IAM operations. */
    const errors = ref([]);
    /** @type {import('vue').Ref<boolean>} Whether users have been loaded from the API. */
    const usersLoaded = ref(false);
    /** @type {import('vue').Ref<boolean>} Whether a user is currently signed in. */
    const isSignedIn = ref(false);
    /** @type {import('vue').Ref<string|null>} Username of the currently signed-in user, or null when unauthenticated. */
    const currentUsername = ref(null);
    /** @type {import('vue').Ref<number>} Identifier of the currently signed-in user; 0 when unauthenticated. */
    const currentUserId = ref(0);
    /** @type {import('vue').ComputedRef<string|null>} The current authentication token. */
    const currentToken = computed(() => isSignedIn.value ? localStorage.getItem('token') : null);


    /**
     * Executes the sign-in use case and updates authentication state.
     * @param {SignInCommand} signInCommand - Sign-in command.
     * @param {import('vue-router').Router} router - Router used to redirect on result.
     * @returns {void}
     */
    function signIn(signInCommand, router) {
        // Implementation for sign-in action
        console.log(signInCommand);
        iamApi.signIn(signInCommand)
            .then(response => {
                let signInResource = SignInAssembler.toResourceFromResponse(response);
                if (signInResource) {
                    let currentUser = UserAssembler.toEntityFromResource(signInResource);
                    currentUsername.value = currentUser.username;
                    currentUserId.value = currentUser.id;
                    localStorage.setItem('token', signInResource.token);
                    isSignedIn.value = true;
                    console.log(`User signed in: ${currentUsername.value}`);
                    errors.value = [];
                    router.push({name: 'home'});
                } else {
                    isSignedIn.value = false;
                    console.log('Sign-in failed');
                    errors.value.push(new Error('Sign-in failed'));
                    router.push({name: 'iam-sign-in'});
                }

            })
            .catch(error => {
                isSignedIn.value = false;
                currentUsername.value = error.name;
                console.log(error);
                errors.value.push(error);
                router.push({name: 'iam-sign-in'});
            });
    }

    /**
     * Executes the sign-up use case and routes the user to the next screen.
     * @param {SignUpCommand} signUpCommand - Sign-up command.
     * @param {import('vue-router').Router} router - Router used to redirect on result.
     * @returns {void}
     */
    function signUp(signUpCommand, router) {
        // Implementation for sign-up action
        iamApi.signUp(signUpCommand)
            .then(response => {
                let signUpResource = SignUpAssembler.toResourceFromResponse(response);
                if (signUpResource) {
                    console.log(signUpResource.message);
                    errors.value = [];
                    router.push({name: 'iam-sign-in'});
                } else {
                    console.log('Sign-up failed');
                    errors.value.push(new Error('Sign-up failed'));
                    router.push({name: 'iam-sign-up'});
                }
            })
            .catch(error => {
                console.log(error);
                errors.value.push(error);
                router.push({name: 'iam-sign-up'});
            });
    }


    /**
     * Loads user entities from infrastructure.
     * @returns {void}
     */
    function fetchUsers() {
        iamApi.getUsers().then(response => {
            users.value = UserAssembler.toEntitiesFromResponse(response);
            usersLoaded.value = true;
            console.log(`Loaded ${users.value.length} users.`);
            errors.value = [];
        }).catch(error => {
            console.error('Error fetching users:', error);
            errors.value.push(error);
        });
    }

    return {
        users,
        errors,
        usersLoaded,
        currentUsername,
        currentUserId,
        currentToken,
        isSignedIn,
        signIn,
        signUp,
        fetchUsers
    };
});

export default useIamStore;