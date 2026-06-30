<script setup>
import { onMounted, ref, computed, toRefs } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import useServiceDesignStore from '../../application/service-design.store.js';
import { KNOWN_SOURCES } from '../../infrastructure/water-batch.assembler.js';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useServiceDesignStore();

const { errors } = toRefs(store);
const { fetchWaterBatches, getWaterBatchById, addWaterBatch, updateWaterBatch } = store;

const isEdit  = computed(() => route.name === 'water-batches-edit');
const saving  = ref(false);

const form = ref({
  certificationCode:   '',
  destinationSectorId: null,
  volumeLiters:        null,
  deliveryTimestamp:   new Date().toISOString().slice(0, 16), // for datetime-local input
  status:              'Pendiente',
  source:              '',
});

const statusOptions = ['Pendiente', 'Entregado', 'Cancelado'];
const sourceOptions = KNOWN_SOURCES;

onMounted(async () => {
  if (isEdit.value) {
    if (!store.waterBatchesLoaded) fetchWaterBatches();
    // small wait so the list resolves if user landed directly on the edit URL
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
      }
    };
    hydrate();
    if (!getWaterBatchById(route.params.id)) setTimeout(hydrate, 600);
  }
});

const errorMsg = ref('');

const validate = () => {
  if (!form.value.certificationCode.trim()) return t('waterBatches.errCertification');
  if (!form.value.destinationSectorId)      return t('waterBatches.errSector');
  if (!form.value.volumeLiters || form.value.volumeLiters <= 0) return t('waterBatches.errVolume');
  if (!form.value.source)                   return t('waterBatches.errSource');
  return '';
};

const onSubmit = async () => {
  errorMsg.value = validate();
  if (errorMsg.value) return;

  // datetime-local has no timezone; convert to a full ISO string for the backend
  const isoDelivery = form.value.deliveryTimestamp
      ? new Date(form.value.deliveryTimestamp).toISOString()
      : new Date().toISOString();

  const payload = {
    id:                  isEdit.value ? Number(route.params.id) : null,
    certificationCode:   form.value.certificationCode.trim(),
    destinationSectorId: Number(form.value.destinationSectorId),
    volumeLiters:        Number(form.value.volumeLiters),
    deliveryTimestamp:   isoDelivery,
    status:              form.value.status,
    source:              form.value.source,
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

      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.destinationSector') }}</label>
        <pv-input-number v-model="form.destinationSectorId" :use-grouping="false" :min="1" />
      </div>

      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.volume') }} (L)</label>
        <pv-input-number v-model="form.volumeLiters" :min="0" :max-fraction-digits="2" suffix=" L" />
      </div>

      <div class="flex flex-column gap-1">
        <label class="font-semibold text-sm">{{ t('waterBatches.source') }}</label>
        <pv-select v-model="form.source" :options="sourceOptions" :placeholder="t('waterBatches.selectSource')" />
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
