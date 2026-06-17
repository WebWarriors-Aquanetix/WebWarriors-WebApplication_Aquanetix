<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useMonitoringStore from '../../application/monitoring.store.js';
import { onMounted, toRefs, ref, computed } from 'vue';

const { t }  = useI18n();
const router = useRouter();
const store  = useMonitoringStore();
const { alerts, alertsLoaded } = toRefs(store);
const { fetchAlerts } = store;

onMounted(() => {
  if (!store.alertsLoaded) fetchAlerts();
});

const severityFilter = ref('all');

const severityOptions = [
  { label: t('alerts.allPriorities'), value: 'all' },
  { label: t('alerts.critical'),      value: 'Crítica' },
  { label: t('alerts.warning'),       value: 'Advertencia' },
];

// Solo alertas ACTIVAS — las resueltas tienen su propia vista
const activeAlerts = computed(() =>
    alerts.value.filter(a =>
        a.status === 'Activa' &&
        (severityFilter.value === 'all' || a.severity === severityFilter.value)
    )
);

const activeCount   = computed(() => alerts.value.filter(a => a.status === 'Activa').length);
const resolvedCount = computed(() => alerts.value.filter(a => a.status === 'Resuelta').length);

const severityIcon     = (s) => s === 'Crítica' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle';
const severityColor    = (s) => s === 'Crítica' ? '#ef4444' : '#f59e0b';
const severitySeverity = (s) => s === 'Crítica' ? 'danger' : 'warn';

const formatDate = (iso) => {
  if (!iso) return '';
  const diff = Math.round((Date.now() - new Date(iso)) / 60000);
  if (diff < 60)   return `Hace ${diff} min`;
  if (diff < 1440) return `Hace ${Math.round(diff / 60)} h`;
  return new Date(iso).toLocaleDateString('es-PE');
};
</script>

<template>
  <div class="p-4">
    <!-- Page header -->
    <div class="mb-4">
      <h1 class="text-3xl font-bold m-0" style="font-family: 'Manrope', sans-serif;">{{ t('alerts.title') }}</h1>
      <p class="text-color-secondary mt-1 mb-0">{{ t('alerts.subtitle') }}</p>
    </div>

    <!-- Barra de estado + filtro -->
    <pv-card class="mb-3">
      <template #content>
        <div class="flex flex-wrap align-items-center justify-content-between gap-3">
          <div class="flex align-items-center gap-3">
                        <span class="text-sm font-semibold">
                            <i class="pi pi-bell mr-1" style="color: #ef4444;"></i>
                            {{ activeCount }} {{ t('alerts.active') }}
                        </span>
            <!-- Botón al historial de resueltas -->
            <pv-button
                :label="`Ver historial (${resolvedCount})`"
                icon="pi pi-history"
                text
                size="small"
                @click="router.push('/monitoring/alerts/resolved')"
            />
          </div>
          <pv-select
              v-model="severityFilter"
              :options="severityOptions"
              option-label="label"
              option-value="value"
              style="width: 200px;"
          />
        </div>
      </template>
    </pv-card>

    <div v-if="!alertsLoaded" class="flex justify-content-center py-6">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: #007BFF;"></i>
    </div>

    <template v-else>
      <!-- Sin alertas activas -->
      <div v-if="activeAlerts.length === 0" class="text-center py-6 text-color-secondary">
        <i class="pi pi-check-circle" style="font-size: 2.5rem; color: #10B981;"></i>
        <p class="mt-2 font-semibold">No hay alertas activas. ¡Todo en orden!</p>
        <p class="text-sm">
          ¿Buscas el historial?
          <pv-button
              label="Ver alertas resueltas"
              text
              size="small"
              @click="router.push('/monitoring/alerts/resolved')"
          />
        </p>
      </div>

      <!-- Lista de activas -->
      <div v-else class="flex flex-column gap-3">
        <pv-card
            v-for="alert in activeAlerts"
            :key="alert.id"
            :style="{
                        borderLeft: alert.severity === 'Crítica'
                            ? '4px solid #ef4444'
                            : '4px solid #f59e0b'
                    }"
        >
          <template #content>
            <div class="flex align-items-start gap-3">
              <i
                  :class="severityIcon(alert.severity)"
                  :style="{ color: severityColor(alert.severity), fontSize: '1.6rem', marginTop: '2px' }"
              ></i>
              <div class="flex-1">
                <div class="flex align-items-center gap-2 mb-1">
                  <pv-tag :value="alert.severity" :severity="severitySeverity(alert.severity)" />
                  <pv-tag value="Activa" severity="danger" />
                </div>
                <p class="font-semibold m-0">{{ alert.message }}</p>
                <p class="text-sm text-color-secondary mt-1 mb-0">
                  {{ alert.sensorName }} &nbsp;·&nbsp; {{ alert.location }} &nbsp;·&nbsp; {{ alert.type }}
                </p>
              </div>
              <div class="text-right" style="min-width: 80px;">
                <p class="text-sm text-color-secondary m-0">{{ formatDate(alert.timestamp) }}</p>
                <pv-button :label="t('alerts.viewDetails')" text size="small" class="mt-2 p-0" />
              </div>
            </div>
          </template>
        </pv-card>
      </div>

      <!-- Info card -->
      <pv-card class="mt-4" style="background: #eff6ff; border: 1px solid #bfdbfe;">
        <template #content>
          <div class="flex align-items-start gap-3">
            <i class="pi pi-info-circle" style="color: #007BFF; font-size: 1.3rem; margin-top: 2px;"></i>
            <div>
              <p class="font-semibold m-0">{{ t('alerts.whatAreAlerts') }}</p>
              <p class="text-sm text-color-secondary mt-1 mb-2">{{ t('alerts.alertsExplanation') }}</p>
              <pv-button :label="t('alerts.viewFullGuide')" text size="small" icon="pi pi-external-link" />
            </div>
          </div>
        </template>
      </pv-card>
    </template>
  </div>
</template>

<style scoped>
</style>