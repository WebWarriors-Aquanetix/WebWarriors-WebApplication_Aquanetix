<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useMonitoringStore from '../../application/monitoring.store.js';
import { onMounted, toRefs, ref, computed } from 'vue';

const { t } = useI18n();
const router = useRouter();
const store = useMonitoringStore();
const { sensors, sensorsLoaded, errors } = toRefs(store);
const { fetchSensors } = store;

onMounted(() => {
  if (!store.sensorsLoaded) fetchSensors();
});

// ── Filtros ────────────────────────────────────────────────────────────────
const search       = ref('');
const statusFilter = ref('all');

const statusOptions = [
  { label: t('sensors.allStatuses'), value: 'all' },
  { label: t('sensors.normalStatus'),  value: 'Normal' },
  { label: t('sensors.warningStatus'), value: 'Advertencia' },
  { label: t('sensors.alertStatus'),   value: 'Alerta' },
];

const filteredSensors = computed(() =>
    sensors.value.filter(s => {
      const matchesSearch =
          s.name.toLowerCase().includes(search.value.toLowerCase()) ||
          s.location.toLowerCase().includes(search.value.toLowerCase()) ||
          s.type.toLowerCase().includes(search.value.toLowerCase());
      const matchesStatus = statusFilter.value === 'all' || s.status === statusFilter.value;
      return matchesSearch && matchesStatus;
    })
);

// ── Navegación — mismo patrón que tutorial-list.vue ───────────────────────

/**
 * Navega a la página de creación de sensor.
 * Equivalente a navigateToNew() en tutorial-list.vue.
 */
const navigateToNew = () => {
  router.push({ name: 'monitoring-sensor-new' });
};

/**
 * Navega a la página de edición de un sensor.
 * Equivalente a navigateToEdit() en tutorial-list.vue.
 * @param {number} id
 */
const navigateToEdit = (id) => {
  router.push({ name: 'monitoring-sensor-edit', params: { id } });
};

/**
 * Navega al detalle de un sensor.
 * @param {number} id
 */
const navigateToDetail = (id) => {
  router.push({ name: 'monitoring-sensor-detail', params: { id } });
};

// ── Helpers ────────────────────────────────────────────────────────────────
const statusSeverity = (status) => {
  if (status === 'Normal')      return 'success';
  if (status === 'Advertencia') return 'warn';
  return 'danger';
};

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};
</script>

<template>
  <div class="p-4">
    <!-- Page header -->
    <div class="mb-4">
      <h1
          class="text-3xl font-bold m-0"
          style="font-family: 'Manrope', sans-serif; color: var(--color-text);"
      >
        {{ t('sensors.title') }}
      </h1>
      <p class="text-color-secondary mt-1 mb-0">{{ t('sensors.subtitle') }}</p>
    </div>

    <!-- Filtros + botón agregar -->
    <pv-card class="mb-3">
      <template #content>
        <div class="flex flex-wrap gap-3 align-items-center">
          <pv-icon-field>
            <pv-input-icon class="pi pi-search" />
            <pv-input-text
                v-model="search"
                :placeholder="t('sensors.search')"
                style="width: 280px;"
            />
          </pv-icon-field>
          <pv-select
              v-model="statusFilter"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              style="width: 200px;"
          />
          <div class="ml-auto">
            <!-- navigateToNew() igual que en tutorial-list.vue -->
            <pv-button
                :label="t('sensors.addSensor')"
                icon="pi pi-plus"
                @click="navigateToNew"
            />
          </div>
        </div>
      </template>
    </pv-card>

    <!-- Tabla de sensores -->
    <pv-card>
      <template #content>
        <pv-data-table
            :value="filteredSensors"
            :loading="!sensorsLoaded"
            striped-rows
            paginator
            :rows="10"
            :rows-per-page-options="[5, 10, 20]"
            table-style="min-width: 50rem"
        >
          <pv-column field="name"     :header="t('sensors.name')"     sortable />
          <pv-column field="location" :header="t('sensors.location')" sortable />
          <pv-column field="type"     :header="t('sensors.type')"     sortable />
          <pv-column :header="t('sensors.currentValue')">
            <template #body="{ data }">
              <span class="font-semibold">{{ data.currentValue }}</span>
              <span class="text-color-secondary ml-1">{{ data.unit }}</span>
            </template>
          </pv-column>
          <pv-column :header="t('sensors.status')">
            <template #body="{ data }">
              <pv-tag :value="data.status" :severity="statusSeverity(data.status)" />
            </template>
          </pv-column>
          <pv-column :header="t('sensors.lastUpdated')">
            <template #body="{ data }">
              <span class="text-sm">{{ formatDate(data.lastUpdated) }}</span>
            </template>
          </pv-column>
          <!-- Acciones: ver detalle + editar — igual que tutorial-list.vue -->
          <pv-column :header="t('sensors.actions')">
            <template #body="slotProps">
              <pv-button
                  icon="pi pi-eye"
                  text
                  rounded
                  @click="navigateToDetail(slotProps.data.id)"
              />
              <pv-button
                  icon="pi pi-pencil"
                  text
                  rounded
                  @click="navigateToEdit(slotProps.data.id)"
              />
            </template>
          </pv-column>
        </pv-data-table>

        <div v-if="errors.length" class="text-red-500 mt-3 text-sm">
          {{ t('errors.occurred') }}: {{ errors.map(e => e.message).join(', ') }}
        </div>
      </template>
    </pv-card>
  </div>
</template>

<style scoped>
</style>
