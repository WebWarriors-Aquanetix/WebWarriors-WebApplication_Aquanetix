<script setup>
import { onMounted, ref, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useDestinationStore from '../../application/destination.store.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useDestinationStore();

const { destinations, destinationsLoaded } = toRefs(store);
const { fetchDestinations, addDestination, deleteDestination } = store;

onMounted(() => { if (!store.destinationsLoaded) fetchDestinations(); });

const form     = ref({ name: '', address: '', description: '' });
const saving   = ref(false);
const formError = ref('');

const submit = async () => {
  formError.value = '';
  if (!form.value.name.trim()) { formError.value = t('destinations.errName'); return; }
  saving.value = true;
  try {
    await addDestination({ ...form.value, name: form.value.name.trim() });
    form.value = { name: '', address: '', description: '' };
  } catch (e) {
    // backend returns 409 with a problem-details message when the name already exists
    formError.value = e?.response?.status === 409
      ? t('destinations.errDuplicate')
      : t('destinations.errSave');
  } finally {
    saving.value = false;
  }
};

const deleteError = ref('');
const confirmId   = ref(null);
const askDelete   = (id) => { deleteError.value = ''; confirmId.value = id; };
const doDelete    = async () => {
  deleteError.value = '';
  try {
    await deleteDestination(confirmId.value);
    confirmId.value = null;
  } catch (e) {
    deleteError.value = e?.response?.status === 409
      ? t('destinations.errInUse')
      : t('destinations.errDeleteGeneric');
  }
};

const goBack = () => router.push({ name: 'water-batches-list' });
</script>

<template>
  <div class="p-4" style="max-width:760px;">
    <div class="flex align-items-center gap-3 mb-3">
      <pv-button icon="pi pi-arrow-left" text @click="goBack" />
      <div>
        <h1 class="text-3xl font-bold m-0" style="font-family:'Manrope',sans-serif;">
          {{ t('destinations.title') }}
        </h1>
        <p class="text-color-secondary mt-1 mb-0">{{ t('destinations.subtitle') }}</p>
      </div>
    </div>

    <!-- Create form -->
    <div class="surface-card p-3 border-round mb-4" style="border:1px solid var(--surface-border);">
      <h3 class="mt-0 mb-3">{{ t('destinations.addTitle') }}</h3>
      <div v-if="formError" class="mb-3 p-2"
           style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;">
        <i class="pi pi-exclamation-circle mr-2"></i>{{ formError }}
      </div>
      <div class="flex flex-column gap-3">
        <div class="flex flex-column gap-1">
          <label class="font-semibold text-sm">{{ t('destinations.name') }}</label>
          <pv-input-text v-model="form.name" placeholder="Planta Norte" />
        </div>
        <div class="flex flex-column gap-1">
          <label class="font-semibold text-sm">{{ t('destinations.address') }}</label>
          <pv-input-text v-model="form.address" :placeholder="t('destinations.addressPlaceholder')" />
        </div>
        <div class="flex flex-column gap-1">
          <label class="font-semibold text-sm">{{ t('destinations.description') }}</label>
          <pv-input-text v-model="form.description" :placeholder="t('destinations.descriptionPlaceholder')" />
        </div>
        <div>
          <pv-button :label="t('destinations.add')" icon="pi pi-plus" :loading="saving" @click="submit" />
        </div>
      </div>
    </div>

    <!-- List -->
    <div v-if="!destinationsLoaded" class="flex justify-content-center py-5">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem;"></i>
    </div>
    <pv-data-table v-else :value="destinations" data-key="id" striped-rows responsive-layout="scroll">
      <template #empty>
        <div class="text-center py-4 text-color-secondary">{{ t('destinations.empty') }}</div>
      </template>
      <pv-column field="name" :header="t('destinations.name')" sortable />
      <pv-column field="address" :header="t('destinations.address')" />
      <pv-column field="description" :header="t('destinations.description')" />
      <pv-column :header="t('destinations.actions')" style="width:6rem;">
        <template #body="{ data }">
          <pv-button icon="pi pi-trash" text rounded severity="danger" size="small" @click="askDelete(data.id)" />
        </template>
      </pv-column>
    </pv-data-table>

    <!-- Delete confirm -->
    <pv-dialog :visible="confirmId !== null" :header="t('destinations.confirmDeleteTitle')" :modal="true"
               :style="{ width: '440px' }" @update:visible="(v)=>{ if(!v){confirmId=null; deleteError='';} }">
      <p class="m-0">{{ t('destinations.confirmDeleteBody') }}</p>
      <div v-if="deleteError" class="mt-3 p-2"
           style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;">
        <i class="pi pi-exclamation-circle mr-2"></i>{{ deleteError }}
      </div>
      <template #footer>
        <pv-button :label="t('option.cancel')" text @click="confirmId=null; deleteError='';" />
        <pv-button :label="t('destinations.delete')" icon="pi pi-trash" severity="danger" @click="doDelete" />
      </template>
    </pv-dialog>
  </div>
</template>
