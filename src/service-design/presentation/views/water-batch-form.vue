<script setup>
import { onMounted, ref, computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import useServiceDesignStore from '../../application/service-design.store.js';
import useDestinationStore from '../../application/destination.store.js';
import { KNOWN_SOURCES } from '../../infrastructure/water-batch.assembler.js';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useServiceDesignStore();
const destinationStore = useDestinationStore();

const { errors } = toRefs(store);
const { fetchWaterBatches, getWaterBatchById, addWaterBatch, updateWaterBatch } = store;
const { destinations } = toRefs(destinationStore);
const { fetchDestinations } = destinationStore;

const isEdit  = computed(() => route.name === 'water-batches-edit');
const saving  = ref(false);

const form = ref({
  certificationCode:   '',
  destinationSectorId: null,  // holds the chosen Destination id (FK)
  volumeLiters:        null,
  deliveryTimestamp:   new Date().toISOString().slice(0, 16), // for datetime-local input
  status:              'Pendiente',
  source:              '',
});

const statusOptions = ['Pendiente', 'Entregado', 'Cancelado'];

// Source options: known catalog + "Otro" sentinel that reveals a free-text field.
const OTHER_SOURCE = '__other__';
const sourceSelect = ref('');     // what the dropdown shows
const sourceOther  = ref('');     // free text when "Otro" is chosen
const sourceOptions = computed(() => [
  ...KNOWN_SOURCES.map(s => ({ label: s, value: s })),
  { label: t('waterBatches.sourceOther'), value: OTHER_SOURCE },
]);
const isOtherSource = computed(() => sourceSelect.value === OTHER_SOURCE);

// Destination dropdown options (id + readable name) from the real backend list.
const destinationOptions = computed(() =>
  destinations.value.map(d => ({ label: d.name, value: d.id })));

onMounted(async () => {
  if (!destinationStore.destinationsLoaded) fetchDestinations();

  if (isEdit.value) {
    if (!store.waterBatchesLoaded) fetchWaterBatches();
    const hydrate = () => {
      const b = getWaterBatchById(route.params.id);
      if (b) {
        form.value = {
          certificationCode:   b.certificationCode,
          destinationSectorId: b.destinationSectorId,
          volumeLiters:        b.volumeLiters,
          deliveryTimestamp:   b.deliveryTimestamp ? b.deliveryTimestamp.slice(0, 16) : '',
          status:              b.status,
          source:              b.source,
        };
        // Reflect the stored source in the dropdown / free-text pair.
        if (b.source && !KNOWN_SOURCES.includes(b.source)) {
          sourceSelect.value = OTHER_SOURCE;
          sourceOther.value  = b.source;
        } else {
          sourceSelect.value = b.source || '';
        }
      }
    };
    hydrate();
    if (!getWaterBatchById(route.params.id)) setTimeout(hydrate, 600);
  }
});

const errorMsg = ref('');

// Resolve the final source string from the dropdown + free-text pair.
const resolvedSource = () =>
  isOtherSource.value ? sourceOther.value.trim() : sourceSelect.value;

const validate = () => {
  if (!form.value.certificationCode.trim()) return t('waterBatches.errCertification');
  if (!form.value.destinationSectorId)      return t('waterBatches.errDestination');
  if (!form.value.volumeLiters || form.value.volumeLiters <= 0) return t('waterBatches.errVolume');
  if (!resolvedSource())                    return t('waterBatches.errSource');
  return '';
};

const onSubmit = async () => {
  errorMsg.value = validate();
  if (errorMsg.value) return;

  const isoDelivery = form.value.deliveryTimestamp
      ? new Date(form.value.deliveryTimestamp).toISOString()
      : new Date().toISOString();

  const payload = {
    id:                  isEdit.value ? Number(route.params.id) : null,
    certificationCode:   form.value.certificationCode.trim(),
    destinationSectorId: Number(form.value.destinationSectorId), // FK to Destination
    volumeLiters:        Number(form.value.volumeLiters),
    deliveryTimestamp:   isoDelivery,
    status:              form.value.status,
    source:              resolvedSource(),
  };

  saving.value = true;
  try {
    if (isEdit.value) await updateWaterBatch(payload);
    else              await addWaterBatch(payload);
    router.push({ name: 'water-batches-list' });
  } catch (_) {
    errorMsg.value = t('waterBatches.errSave');
  } finally {
    saving.value = false;
  }
};

const onCancel = () => router.push({ name: 'water-batches-list' });
</script>

<template>
  <div class="p-4" style="max-width:640px;">
    <div class="flex align-items-center gap-3 mb-3">
      <pv-button icon="pi pi-arrow-left" text @click="onCancel" />
      <h1 class="text-3xl font-bold m-0" style="font-family:'Manrope',sans-serif;">
        {{ isEdit ? t('waterBatches.editTitle') : t('waterBatches.newTitle') }}
      </h1>
    </div>

    <div v-if="errorMsg" class="mb-3 p-3"
         style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;">
      <i class="pi pi-exclamation-circle mr-2"></i>{{ errorMsg }}
    </div>

    <div class="flex flex-column gap-3">
      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.certificationCode') }}</label>
        <pv-input-text v-model="form.certificationCode" placeholder="CERT-2026-0001" />
      </div>

      <!-- Destination: dropdown of registered destinations (required) -->
      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.destination') }}</label>
        <pv-select v-model="form.destinationSectorId" :options="destinationOptions"
                   option-label="label" option-value="value"
                   :placeholder="t('waterBatches.selectDestination')" filter />
        <small v-if="destinationOptions.length === 0" class="text-color-secondary">
          {{ t('waterBatches.noDestinations') }}
        </small>
      </div>

      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.volume') }} (L)</label>
        <pv-input-number v-model="form.volumeLiters" :min="0" :max-fraction-digits="2" suffix=" L" />
      </div>

      <!-- Source: known catalog + "Otro" free text -->
      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.source') }}</label>
        <pv-select v-model="sourceSelect" :options="sourceOptions"
                   option-label="label" option-value="value"
                   :placeholder="t('waterBatches.selectSource')" />
        <pv-input-text v-if="isOtherSource" v-model="sourceOther"
                       class="mt-2" :placeholder="t('waterBatches.sourceOtherPlaceholder')" />
      </div>

      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.delivery') }}</label>
        <input v-model="form.deliveryTimestamp" type="datetime-local"
               class="p-inputtext p-component" style="width:100%;" />
      </div>

      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.status') }}</label>
        <pv-select v-model="form.status" :options="statusOptions" />
      </div>

      <div class="flex gap-2 mt-2">
        <pv-button :label="t('option.cancel')" text @click="onCancel" />
        <pv-button :label="t('waterBatches.save')" icon="pi pi-check" :loading="saving" @click="onSubmit" />
      </div>
    </div>
  </div>
</template>

<style scoped>
</style>
