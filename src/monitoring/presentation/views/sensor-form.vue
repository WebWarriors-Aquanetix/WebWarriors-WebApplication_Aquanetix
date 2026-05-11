<script setup>
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import useMonitoringStore from '../../application/monitoring.store.js';
import { Sensor } from '../../domain/model/sensor.entity.js';
import { computed, onMounted, ref } from 'vue';

const { t }  = useI18n();
const route  = useRoute();
const router = useRouter();
const store  = useMonitoringStore();
const { errors, addSensor, fetchSensors } = store;

// Mismo patrón que tutorial-form.vue: isEdit determina si es nuevo o edición
const isEdit = computed(() => !!route.params.id);

const form = ref({
  name:     '',
  location: '',
  type:     '',
  unit:     '',
  minAlert: null,
  maxAlert: null,
});

// Opciones de tipo de sensor
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

// Unidad sugerida por tipo — igual que en el dialog anterior
const unitSuggestions = {
  'pH':              'pH',
  'Turbidez':        'NTU',
  'Presión':         'bar',
  'Nivel':           '%',
  'Cloro':           'ppm',
  'Flujo':           '%',
  'Oxígeno disuelto':'mg/L',
  'Temperatura':     '°C',
};

const onTypeChange = () => {
  if (form.value.type && unitSuggestions[form.value.type]) {
    form.value.unit = unitSuggestions[form.value.type];
  }
};

onMounted(() => {
  // Si es edición, primero aseguramos que los sensores estén cargados
  // y luego pre-llenamos el form — igual que tutorial-form.vue
  if (isEdit.value) {
    if (!store.sensorsLoaded) fetchSensors();

    // Pequeño watcher para esperar a que carguen si aún no están
    const tryFill = () => {
      const sensor = store.getSensorById(route.params.id);
      if (sensor) {
        form.value.name     = sensor.name;
        form.value.location = sensor.location;
        form.value.type     = sensor.type;
        form.value.unit     = sensor.unit;
        form.value.minAlert = sensor.minAlert;
        form.value.maxAlert = sensor.maxAlert;
      } else {
        // Si aún no cargaron, reintenta en 300ms
        setTimeout(tryFill, 300);
      }
    };
    tryFill();
  }
});

/**
 * Guarda el sensor.
 * Si es nuevo llama a addSensor(); si es edición llama a updateSensor().
 * Mismo patrón que saveTutorial() en tutorial-form.vue.
 */
const saveSensor = () => {
  const sensor = new Sensor({
    id:           isEdit.value ? parseInt(route.params.id) : null,
    name:         form.value.name,
    location:     form.value.location,
    type:         form.value.type,
    unit:         form.value.unit,
    currentValue: 0,
    status:       'Normal',
    lastUpdated:  new Date().toISOString(),
    recommendedRange: `${form.value.minAlert} - ${form.value.maxAlert}`,
    minAlert:     Number(form.value.minAlert),
    maxAlert:     Number(form.value.maxAlert),
    history:      [],
  });

  if (isEdit.value) {
    store.updateSensor(sensor);
  } else {
    addSensor(sensor);
  }

  navigateBack();
};

/**
 * Vuelve a la lista de sensores.
 * Mismo patrón que navigateBack() en tutorial-form.vue.
 */
const navigateBack = () => {
  router.push({ name: 'monitoring-sensors' });
};
</script>

<template>
  <div class="p-4">
    <!-- Título dinámico: "Nuevo sensor" o "Editar sensor" -->
    <h1
        class="text-3xl font-bold mb-4"
        style="font-family: 'Manrope', sans-serif; color: var(--color-text);"
    >
      {{ isEdit ? 'Editar sensor' : 'Nuevo sensor' }}
    </h1>

    <!-- Mismo patrón de form que tutorial-form.vue: @submit.prevent + campos field -->
    <form @submit.prevent="saveSensor">

      <div class="field mb-3">
        <label for="sensor-name" class="font-medium mb-1 block">
          {{ t('sensors.name') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-input-text
            id="sensor-name"
            v-model="form.name"
            class="w-full"
            required
            placeholder="Ej: SENSOR-07"
        />
      </div>

      <div class="field mb-3">
        <label for="sensor-location" class="font-medium mb-1 block">
          {{ t('sensors.location') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-input-text
            id="sensor-location"
            v-model="form.location"
            class="w-full"
            required
            placeholder="Ej: Planta Norte"
        />
      </div>

      <div class="field mb-3">
        <label for="sensor-type" class="font-medium mb-1 block">
          {{ t('sensors.type') }} <span style="color: #ef4444;">*</span>
        </label>
        <pv-select
            id="sensor-type"
            v-model="form.type"
            :options="sensorTypeOptions"
            option-label="label"
            option-value="value"
            placeholder="Selecciona un tipo"
            class="w-full"
            @change="onTypeChange"
        />
      </div>

      <div class="field mb-3">
        <label for="sensor-unit" class="font-medium mb-1 block">
          Unidad de medida <span style="color: #ef4444;">*</span>
        </label>
        <pv-input-text
            id="sensor-unit"
            v-model="form.unit"
            class="w-full"
            required
            placeholder="Ej: pH, NTU, bar, %"
        />
        <small class="text-color-secondary">Se autocompleta al elegir el tipo.</small>
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="field mb-3">
            <label for="sensor-min" class="font-medium mb-1 block">
              Umbral mínimo <span style="color: #ef4444;">*</span>
            </label>
            <pv-input-number
                id="sensor-min"
                v-model="form.minAlert"
                class="w-full"
                :min="0"
                :max-fraction-digits="2"
                placeholder="0.0"
            />
          </div>
        </div>
        <div class="col-12 md:col-6">
          <div class="field mb-3">
            <label for="sensor-max" class="font-medium mb-1 block">
              Umbral máximo <span style="color: #ef4444;">*</span>
            </label>
            <pv-input-number
                id="sensor-max"
                v-model="form.maxAlert"
                class="w-full"
                :min="0"
                :max-fraction-digits="2"
                placeholder="100.0"
            />
          </div>
        </div>
      </div>

      <!-- Botones en el mismo orden que el learning-center: Save | Cancel -->
      <pv-button type="submit" :label="isEdit ? 'Actualizar sensor' : 'Guardar sensor'" icon="pi pi-save" />
      <pv-button
          type="button"
          label="Cancelar"
          severity="secondary"
          class="ml-2"
          @click="navigateBack"
      />

    </form>

    <div v-if="errors.length" class="text-red-500 mt-3">
      {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
    </div>
  </div>
</template>

<style scoped>
</style>