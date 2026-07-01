<script setup>
import { onMounted, computed, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useServiceDesignStore from '../../application/service-design.store.js';
import useDestinationStore from '../../application/destination.store.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useServiceDesignStore();
const destinationStore = useDestinationStore();
const { destinations } = toRefs(destinationStore);

const { waterBatches, waterBatchesLoaded } = toRefs(store);
const { fetchWaterBatches, deleteWaterBatch } = store;

onMounted(() => {
  if (!store.waterBatchesLoaded) fetchWaterBatches();
  if (!destinationStore.destinationsLoaded) destinationStore.fetchDestinations();
});

const search = ref('');
const filteredBatches = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return waterBatches.value;
  return waterBatches.value.filter(b =>
      (b.certificationCode ?? '').toLowerCase().includes(q) ||
      (b.source ?? '').toLowerCase().includes(q) ||
      destinationName(b.destinationSectorId).toLowerCase().includes(q));
});

const statusSeverity = (status) => ({
  Pendiente: 'warn',
  Entregado: 'success',
  Cancelado: 'danger',
}[status] ?? 'info');

const destinationName = (id) => {
  const d = destinations.value.find(x => String(x.id) === String(id));
  return d ? d.name : (id ?? '—');
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-PE');
};

const goNew    = ()   => router.push({ name: 'water-batches-new' });
const goEdit   = (id) => router.push({ name: 'water-batches-edit', params: { id } });

const confirmDeleteId = ref(null);
const askDelete  = (id) => { confirmDeleteId.value = id; };
const doDelete   = async () => {
  if (confirmDeleteId.value == null) return;
  try { await deleteWaterBatch(confirmDeleteId.value); } finally { confirmDeleteId.value = null; }
};
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
      <div>
        <h1 class="text-3xl font-bold m-0" style="font-family:'Manrope',sans-serif;">
          {{ t('waterBatches.title') }}
        </h1>
        <p class="text-color-secondary mt-1 mb-0">{{ t('waterBatches.subtitle') }}</p>
      </div>
      <div class="flex gap-2">
        <pv-button :label="t('destinations.manage')" icon="pi pi-map-marker" severity="secondary"
                   @click="router.push({ name: 'destinations-manage' })" />
        <pv-button :label="t('waterBatches.addBatch')" icon="pi pi-plus" @click="goNew" />
      </div>
    </div>

    <!-- Search -->
    <span class="p-input-icon-left mb-3" style="display:block;max-width:360px;">
      <i class="pi pi-search" />
      <pv-input-text v-model="search" :placeholder="t('waterBatches.searchPlaceholder')" class="w-full" />
    </span>

    <!-- Loading -->
    <div v-if="!waterBatchesLoaded" class="flex justify-content-center py-6">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem;"></i>
    </div>

    <!-- Table -->
    <pv-data-table
        v-else
        :value="filteredBatches"
        paginator
        :rows="10"
        data-key="id"
        striped-rows
        responsive-layout="scroll"
    >
      <template #empty>
        <div class="text-center py-4 text-color-secondary">{{ t('waterBatches.empty') }}</div>
      </template>

      <pv-column field="certificationCode" :header="t('waterBatches.certificationCode')" sortable />
      <pv-column :header="t('waterBatches.destination')" sortable field="destinationSectorId">
        <template #body="{ data }">{{ destinationName(data.destinationSectorId) }}</template>
      </pv-column>
      <pv-column :header="t('waterBatches.volume')" sortable field="volumeLiters">
        <template #body="{ data }">{{ Number(data.volumeLiters).toLocaleString('es-PE') }} L</template>
      </pv-column>
      <pv-column field="source" :header="t('waterBatches.source')" sortable />
      <pv-column :header="t('waterBatches.delivery')" sortable field="deliveryTimestamp">
        <template #body="{ data }">{{ formatDate(data.deliveryTimestamp) }}</template>
      </pv-column>
      <pv-column field="status" :header="t('waterBatches.status')" sortable>
        <template #body="{ data }">
          <pv-tag :value="data.status" :severity="statusSeverity(data.status)" />
        </template>
      </pv-column>
      <pv-column :header="t('waterBatches.actions')" style="width:8rem;">
        <template #body="{ data }">
          <div class="flex gap-1">
            <pv-button icon="pi pi-pencil" text rounded size="small" @click="goEdit(data.id)" />
            <pv-button icon="pi pi-trash" text rounded severity="danger" size="small" @click="askDelete(data.id)" />
          </div>
        </template>
      </pv-column>
    </pv-data-table>

    <!-- Delete confirm -->
    <pv-dialog
        :visible="confirmDeleteId !== null"
        :header="t('waterBatches.confirmDeleteTitle')"
        :modal="true"
        :style="{ width: '420px' }"
        @update:visible="(v) => { if (!v) confirmDeleteId = null; }"
    >
      <p class="m-0">{{ t('waterBatches.confirmDeleteBody') }}</p>
      <template #footer>
        <pv-button :label="t('option.cancel')" text @click="confirmDeleteId = null" />
        <pv-button :label="t('waterBatches.delete')" icon="pi pi-trash" severity="danger" @click="doDelete" />
      </template>
    </pv-dialog>
  </div>
</template>

<style scoped>
</style>
