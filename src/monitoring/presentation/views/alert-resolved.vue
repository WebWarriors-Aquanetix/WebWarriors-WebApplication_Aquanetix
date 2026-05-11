<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useMonitoringStore from '../../application/monitoring.store.js';
import { onMounted, toRefs, computed } from 'vue';

const { t }  = useI18n();
const router = useRouter();
const store  = useMonitoringStore();
const { alerts, alertsLoaded } = toRefs(store);
const { fetchAlerts } = store;

onMounted(() => {
  if (!store.alertsLoaded) fetchAlerts();
});

const resolvedAlerts = computed(() =>
    alerts.value.filter(a => a.status === 'Resuelta')
);

const severityIcon     = (s) => s === 'Crítica' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle';
const severitySeverity = (s) => s === 'Crítica' ? 'danger' : 'warn';

const formatDate = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' });
};
</script>

<template>
  <div class="p-4">
    <!-- Header con botón de regreso -->
    <div class="flex align-items-center gap-3 mb-4">
      <pv-button
          icon="pi pi-arrow-left"
          text
          @click="router.push('/monitoring/alerts')"
      />
      <div>
        <h1 class="text-3xl font-bold m-0" style="font-family: 'Manrope', sans-serif;">Historial de alertas</h1>
        <p class="text-color-secondary mt-1 mb-0">
          Registro de alertas que ya fueron atendidas y resueltas.
        </p>
      </div>
    </div>

    <div v-if="!alertsLoaded" class="flex justify-content-center py-6">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
    </div>

    <template v-else>
      <div v-if="resolvedAlerts.length === 0" class="text-center py-6 text-color-secondary">
        <i class="pi pi-inbox" style="font-size: 2.5rem;"></i>
        <p class="mt-2">No hay alertas resueltas en el historial.</p>
      </div>

      <div v-else>
        <!-- Contador informativo -->
        <pv-card class="mb-3">
          <template #content>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-history" style="color: #10B981; font-size: 1.2rem;"></i>
              <span class="text-sm">
                                <strong>{{ resolvedAlerts.length }}</strong> alerta(s) resuelta(s) en el historial
                            </span>
            </div>
          </template>
        </pv-card>

        <!-- Lista de resueltas -->
        <div class="flex flex-column gap-2">
          <pv-card
              v-for="alert in resolvedAlerts"
              :key="alert.id"
              style="opacity: 0.8; border-left: 4px solid #10B981;"
          >
            <template #content>
              <div class="flex align-items-start gap-3">
                <i
                    :class="severityIcon(alert.severity)"
                    style="color: #94a3b8; font-size: 1.3rem; margin-top: 2px;"
                ></i>
                <div class="flex-1">
                  <div class="flex align-items-center gap-2 mb-1">
                    <pv-tag :value="alert.severity" :severity="severitySeverity(alert.severity)" />
                    <pv-tag value="Resuelta" severity="success" />
                  </div>
                  <p class="text-sm font-medium m-0" style="color: #475569;">
                    {{ alert.message }}
                  </p>
                  <p class="text-xs text-color-secondary mt-1 mb-0">
                    {{ alert.sensorName }} &nbsp;·&nbsp; {{ alert.location }} &nbsp;·&nbsp; {{ alert.type }}
                  </p>
                </div>
                <div class="text-right" style="min-width: 120px;">
                  <p class="text-xs text-color-secondary m-0">{{ formatDate(alert.timestamp) }}</p>
                </div>
              </div>
            </template>
          </pv-card>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
</style>
