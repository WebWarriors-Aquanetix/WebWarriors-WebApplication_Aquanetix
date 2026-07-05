<script setup>
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import useMonitoringStore from '../../../monitoring/application/monitoring.store.js';
import useDestinationStore from '../../../service-design/application/destination.store.js';
import { Sensor } from '../../../monitoring/domain/model/sensor.entity.js';
import { Alert } from '../../../monitoring/domain/model/alert.entity.js';
import { computed, onMounted, ref, toRefs } from 'vue';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useMonitoringStore();
const destinationStore = useDestinationStore();
const { errors, addSensor, addAlert, fetchSensors, deleteSensor,
  resolveAlertBySensorName, deleteAlertsBySensorName } = store;
const { destinations } = toRefs(destinationStore);

const destinationOptions = computed(() =>
  destinations.value.map(d => ({ label: d.name, value: d.id })));

const showDeleteDialog = ref(false);
const formError = ref('');
const isLimitError = ref(false);

const confirmDelete = () => {
  deleteAlertsBySensorName(form.value.name);
  deleteSensor(route.params.id);
  router.push({ name: 'devices-list' });
};

const isEdit = computed(() => !!route.params.id);

const form = ref({
  name:         '',
  location:     '',
  destinationId: null,
  type:         '',
  unit:         '',
  currentValue: null,
  minAlert:     null,
  maxAlert:     null,
});

const sensorTypeOptions = [
  { label: 'pH',               value: 'pH' },
  { label: 'Turbidez',         value: 'Turbidez' },
  { label: 'Presión',          value: 'Presión' },
  { label: 'Nivel',            value: 'Nivel' },
  { label: 'Cloro',            value: 'Cloro' },
  { label: 'Flujo',            value: 'Flujo' },
  { label: 'Oxígeno disuelto', value: 'Oxígeno disuelto' },
  { label: 'Temperatura',      value: 'Temperatura' },
];

const unitSuggestions = {
  'pH': 'pH', 'Turbidez': 'NTU', 'Presión': 'bar',
  'Nivel': '%', 'Cloro': 'ppm', 'Flujo': '%',
  'Oxígeno disuelto': 'mg/L', 'Temperatura': '°C',
};

const onTypeChange = () => {
  if (form.value.type && unitSuggestions[form.value.type]) {
    form.value.unit = unitSuggestions[form.value.type];
  }
};

/**
 * Genera historial de 7 lecturas con variación de ±8% alrededor del valor actual.
 */
const generateHistory = (currentValue) => {
  const base = Number(currentValue) || 0;
  if (base === 0) return [0, 0, 0, 0, 0, 0, 0];
  const variation = base * 0.08;
  return Array.from({ length: 7 }, (_, i) => {
    if (i === 6) return parseFloat(base.toFixed(2));
    const rand = base + (Math.random() * variation * 2 - variation);
    return parseFloat(rand.toFixed(2));
  });
};

/**
 * Calcula el status del sensor según su valor vs umbrales.
 * - Fuera del rango (< min o > max)  → 'Alerta'
 * - Cerca del límite (dentro del 10%) → 'Advertencia'
 * - Todo bien                         → 'Normal'
 */
const calcStatus = (value, min, max) => {
  if (value < min || value > max) return 'Alerta';
  const margin = (max - min) * 0.1;
  if (value <= min + margin || value >= max - margin) return 'Advertencia';
  return 'Normal';
};

onMounted(() => {
  if (!destinationStore.destinationsLoaded) destinationStore.fetchDestinations();
  if (isEdit.value) {
    if (!store.sensorsLoaded) fetchSensors();
    const tryFill = () => {
      const sensor = store.getSensorById(route.params.id);
      if (sensor) {
        form.value.name         = sensor.name;
        form.value.location     = sensor.location;
        form.value.destinationId = sensor.destinationId ?? null;
        form.value.type         = sensor.type;
        form.value.unit         = sensor.unit;
        form.value.currentValue = sensor.currentValue;
        form.value.minAlert     = sensor.minAlert;
        form.value.maxAlert     = sensor.maxAlert;
      } else {
        setTimeout(tryFill, 300);
      }
    };
    tryFill();
  }
});

const saveSensor = async () => {
  formError.value = '';
  isLimitError.value = false;
  const cv     = Number(form.value.currentValue) || 0;
  const min    = Number(form.value.minAlert);
  const max    = Number(form.value.maxAlert);
  const status = calcStatus(cv, min, max);

  // Location = the chosen destination's name (readable), destinationId = the FK.
  const chosenDest = destinations.value.find(d => String(d.id) === String(form.value.destinationId));
  const destName   = chosenDest ? chosenDest.name : (form.value.location ?? '');

  const sensor = new Sensor({
    id:               isEdit.value ? route.params.id : null,
    name:             form.value.name,
    location:         destName,
    destinationId:    form.value.destinationId,
    type:             form.value.type,
    unit:             form.value.unit,
    currentValue:     cv,
    status,
    lastUpdated:      new Date().toISOString(),
    recommendedRange: `${min} - ${max} ${form.value.unit}`,
    minAlert:         min,
    maxAlert:         max,
    history:          generateHistory(cv),
  });

  const buildAlert = (sensorName, severity, cv, min, max) => new Alert({
    sensorName,
    location:  destName,
    type:      form.value.type,
    severity,
    message:   severity === 'Crítica'
        ? `El sensor ${sensorName} (${form.value.type}) superó el umbral permitido.`
        : `El sensor ${sensorName} (${form.value.type}) se encuentra cerca del límite.`,
    timestamp: new Date().toISOString(),
    status:    'Activa',
    value:     cv,
    threshold: cv < min ? min : max,
  });

  try {
    if (!form.value.destinationId) {
      formError.value = t('sensors.errDestinationRequired');
      return;
    }
    if (isEdit.value) {
      await store.updateSensor(sensor);
      resolveAlertBySensorName(form.value.name);
    } else {
      const created = await store.addSensor(sensor);
      if (created) sensor.id = created.id;
    }

    // Crear alerta si el estado lo requiere (device ya existe en backend)
    if (status === 'Alerta' || status === 'Advertencia') {
      const severity = status === 'Alerta' ? 'Crítica' : 'Advertencia';
      sensor.sensorName = form.value.name;
      addAlert(buildAlert(form.value.name, severity, cv, min, max));
    }
  } catch (e) {
    // Show the backend's message (e.g. plan device limit reached → 400).
    const backendMsg = e?.response?.data?.message;
    formError.value = backendMsg || t('sensors.errSaveGeneric');
    // Detect the plan-limit case to offer an "upgrade plan" shortcut.
    isLimitError.value = e?.response?.status === 400
      && /límite|limit/i.test(backendMsg || '');
    return; // stay on the form so the user sees why it failed
  }

  navigateBack();
};

const navigateBack = () => {
  router.push({ name: 'devices-list' });
};
</script>

<template>
  <div class="p-4">
    <h1 class="text-3xl font-bold mb-4" style="font-family: 'Manrope', sans-serif; color: var(--color-text);">
      {{ isEdit ? t('sensors.editSensor') : t('sensors.newSensor') }}
    </h1>

    <form @submit.prevent="saveSensor">

      <div v-if="formError" class="mb-3 p-3"
           style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;">
        <i class="pi pi-exclamation-circle mr-2"></i>{{ formError }}
        <div v-if="isLimitError" class="mt-2">
          <pv-button :label="t('sensors.upgradePlan')" icon="pi pi-arrow-up" size="small"
                     @click="router.push({ name: 'subscription-detail' })" />
        </div>
      </div>

      <div class="field mb-3">
        <label for="sensor-name" class="font-medium mb-1 block">
          {{ t('sensors.name') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-input-text id="sensor-name" v-model="form.name" class="w-full" required placeholder="Ej: SENSOR-07" />
      </div>

      <div class="field mb-3">
        <label for="sensor-location" class="font-medium mb-1 block">
          {{ t('sensors.location') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-select
            id="sensor-location" v-model="form.destinationId"
            :options="destinationOptions" option-label="label" option-value="value"
            :placeholder="t('sensors.selectDestination')" class="w-full" filter />
        <small v-if="destinationOptions.length === 0" class="text-color-secondary">
          {{ t('sensors.noDestinations') }}
        </small>
      </div>

      <div class="field mb-3">
        <label for="sensor-type" class="font-medium mb-1 block">
          {{ t('sensors.type') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-select
            id="sensor-type" v-model="form.type"
            :options="sensorTypeOptions" option-label="label" option-value="value"
            :placeholder="t('sensors.typePlaceholder')" class="w-full" @change="onTypeChange"
        />
      </div>

      <div class="field mb-3">
        <label for="sensor-unit" class="font-medium mb-1 block">
          {{ t('sensors.unitOfMeasure') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-input-text id="sensor-unit" v-model="form.unit" class="w-full" required placeholder="pH, NTU, bar, %" />
        <small class="text-color-secondary">{{ t('sensors.autoFilled') }}</small>
      </div>

      <div class="field mb-3">
        <label for="sensor-current" class="font-medium mb-1 block">
          {{ t('sensors.currentValueLabel') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-input-number id="sensor-current" v-model="form.currentValue" class="w-full" :min="0" :max-fraction-digits="2" placeholder="Ej: 7.2" />
        <small class="text-color-secondary">
          {{ t('sensors.historyGenNote') }} {{ t('sensors.alertAutoNote') }}
        </small>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="field mb-3">
            <label for="sensor-min" class="font-medium mb-1 block">
              {{ t('sensors.minThreshold') }} <span style="color: #ef4444;">*</span>
            </label>
            <pv-input-number id="sensor-min" v-model="form.minAlert" class="w-full" :min="0" :max-fraction-digits="2" placeholder="0.0" />
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="field mb-3">
            <label for="sensor-max" class="font-medium mb-1 block">
              {{ t('sensors.maxThreshold') }} <span style="color: #ef4444;">*</span>
            </label>
            <pv-input-number id="sensor-max" v-model="form.maxAlert" class="w-full" :min="0" :max-fraction-digits="2" placeholder="100.0" />
          </div>
        </div>
      </div>

      <pv-button type="submit" :label="isEdit ? t('sensors.updateSensor') : t('sensors.saveSensor')" icon="pi pi-save" />
      <pv-button type="button" :label="t('sensors.cancel')" severity="secondary" class="ml-2" @click="navigateBack" />
      <pv-button
          v-if="isEdit"
          type="button"
          :label="t('sensors.deleteSensor')"
          severity="danger"
          icon="pi pi-trash"
          class="ml-2"
          @click="showDeleteDialog = true"
      />

      <!-- Diálogo de confirmación -->
      <pv-dialog
          v-model:visible="showDeleteDialog"
          :header="t('sensors.confirmDeleteTitle')"
          :modal="true"
          :style="{ width: '380px' }"
      >
        <div class="flex align-items-center gap-3">
          <i class="pi pi-exclamation-triangle" style="font-size: 2rem; color: #ef4444;"></i>
          <span>{{ t('sensors.confirmDeleteMsg', { name: form.name }) }}</span>
        </div>
        <template #footer>
          <pv-button :label="t('sensors.cancel')" text @click="showDeleteDialog = false" />
          <pv-button :label="t('sensors.confirmDeleteBtn')" severity="danger" icon="pi pi-trash" @click="confirmDelete" />
        </template>
      </pv-dialog>

    </form>

    <div v-if="errors.length" class="text-red-500 mt-3">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>
  </div>
</template>

<style scoped>
</style>