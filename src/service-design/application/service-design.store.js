import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { ServiceDesignApi } from '../infrastructure/service-design-api.js';
import { WaterBatchAssembler } from '../infrastructure/water-batch.assembler.js';

const serviceDesignApi = new ServiceDesignApi();

/**
 * Store for the Service Design / Water Batches bounded context.
 * Follows the same conventions as monitoring.store.js: state refs, a *Loaded flag
 * to avoid duplicate fetches, an errors array, and thin actions that delegate
 * translation to the assembler.
 */
const useServiceDesignStore = defineStore('serviceDesign', () => {

    const waterBatches       = ref([]);
    const waterBatchesLoaded = ref(false);
    const errors             = ref([]);

    const totalVolume     = computed(() =>
        waterBatches.value.reduce((acc, b) => acc + (Number(b.volumeLiters) || 0), 0));
    const pendingBatches  = computed(() =>
        waterBatches.value.filter(b => b.status === 'Pendiente'));
    const deliveredCount  = computed(() =>
        waterBatches.value.filter(b => b.status === 'Entregado').length);

    function fetchWaterBatches() {
        serviceDesignApi.getWaterBatches()
            .then(response => {
                waterBatches.value = WaterBatchAssembler.toEntitiesFromResponse(response);
                waterBatchesLoaded.value = true;
            })
            .catch(error => { errors.value.push(error); waterBatchesLoaded.value = true; });
    }

    function getWaterBatchById(id) {
        return waterBatches.value.find(b => String(b.id) === String(id));
    }

    function addWaterBatch(batch) {
        const payload = WaterBatchAssembler.toCreateResource(batch);
        return serviceDesignApi.createWaterBatch(payload)
            .then(response => {
                const created = WaterBatchAssembler.toEntityFromResource(response.data);
                waterBatches.value.push(created);
                return created;
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    function updateWaterBatch(batch) {
        const payload = WaterBatchAssembler.toUpdateResource(batch);
        return serviceDesignApi.updateWaterBatch(batch.id, payload)
            .then(response => {
                const updated = WaterBatchAssembler.toEntityFromResource(response.data);
                const index = waterBatches.value.findIndex(b => String(b.id) === String(updated.id));
                if (index !== -1) waterBatches.value[index] = updated;
                return updated;
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    function deleteWaterBatch(id) {
        // Backend DOES expose DELETE /water-batches/{id} (204 No Content),
        // so unlike devices/alerts this is a real remote delete.
        return serviceDesignApi.deleteWaterBatch(id)
            .then(() => {
                waterBatches.value = waterBatches.value.filter(b => String(b.id) !== String(id));
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    return {
        waterBatches, waterBatchesLoaded, errors,
        totalVolume, pendingBatches, deliveredCount,
        fetchWaterBatches, getWaterBatchById,
        addWaterBatch, updateWaterBatch, deleteWaterBatch,
    };
});

export default useServiceDesignStore;
