import { defineStore } from 'pinia';
import { ref } from 'vue';
import { DestinationApi } from '../infrastructure/destination-api.js';
import { DestinationAssembler } from '../infrastructure/destination.assembler.js';

const destinationApi = new DestinationApi();

/**
 * Store for Destinations (Service Design context).
 * Same conventions as the other stores: state refs, a *Loaded flag, errors array,
 * thin actions delegating translation to the assembler.
 */
const useDestinationStore = defineStore('destinations', () => {
    const destinations       = ref([]);
    const destinationsLoaded = ref(false);
    const errors             = ref([]);

    function fetchDestinations() {
        destinationApi.getDestinations()
            .then(response => {
                destinations.value = DestinationAssembler.toEntitiesFromResponse(response);
                destinationsLoaded.value = true;
            })
            .catch(error => { errors.value.push(error); destinationsLoaded.value = true; });
    }

    function addDestination(destination) {
        const payload = DestinationAssembler.toCreateResource(destination);
        return destinationApi.createDestination(payload)
            .then(response => {
                const created = DestinationAssembler.toEntityFromResource(response.data);
                destinations.value.push(created);
                return created;
            });
        // NOTE: 409 (duplicate name) surfaces as a rejected promise; the view shows the message.
    }

    function deleteDestination(id) {
        return destinationApi.deleteDestination(id)
            .then(() => {
                destinations.value = destinations.value.filter(d => String(d.id) !== String(id));
            });
        // NOTE: 409 (in use) surfaces as a rejected promise; the view shows the message.
    }

    return {
        destinations, destinationsLoaded, errors,
        fetchDestinations, addDestination, deleteDestination,
    };
});

export default useDestinationStore;
