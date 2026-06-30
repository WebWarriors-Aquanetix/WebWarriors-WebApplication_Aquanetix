/**
 * Application service store for the IAM bounded context.
 * It coordinates authentication commands and exposes UI-facing auth state.
 *
 * @module useIamStore
 */
import {IamApi} from "../infrastructure/iam-api.js";
import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {UserAssembler} from "../infrastructure/user.assembler.js";

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
        fetchUsers
    };
});

export default useIamStore;