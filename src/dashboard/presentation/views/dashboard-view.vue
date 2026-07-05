<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useMonitoringStore from '../../../monitoring/application/monitoring.store.js';
import useSubscriptionStore from '../../../subscriptions/application/subscription.store.js';
import { onMounted, toRefs, computed } from 'vue';

const { t } = useI18n();
const router = useRouter();
const store = useMonitoringStore();
const subscriptionStore = useSubscriptionStore();
const { sensors, alerts, sensorsLoaded, alertsLoaded } = toRefs(store);
const { subscription, plans, subscriptionLoaded } = toRefs(subscriptionStore);
const { fetchSensors, fetchAlerts } = store;
const { fetchSubscription, fetchPlans } = subscriptionStore;

onMounted(() => {
  if (!store.sensorsLoaded)      fetchSensors();
  if (!store.alertsLoaded)       fetchAlerts();
  fetchSubscription();
  if (!subscriptionStore.plansLoaded)        fetchPlans();
});

// Cross the current subscription's plan with the real catalog to get its price.
const currentPlan = computed(() =>
  plans.value.find(p => p.name === subscription.value?.plan) ?? null);

const activeSensors  = computed(() => sensors.value.filter(s => s.status !== 'Alerta').length);
const criticalAlerts = computed(() => alerts.value.filter(a => a.severity === 'Crítica' && a.status === 'Activa').length);
const recentAlerts   = computed(() => alerts.value.slice(0, 3));

const systemOk = computed(() => criticalAlerts.value === 0);

const severityColor = (severity) => severity === 'Crítica' ? 'danger' : 'warn';
const severityIcon  = (severity) => severity === 'Crítica' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-4">
      <h1 class="text-3xl font-bold m-0" style="font-family: 'Manrope', sans-serif; color: var(--color-text);">{{ t('dashboard.title') }}</h1>
      <p class="text-color-secondary mt-1 mb-0">{{ t('dashboard.subtitle') }}</p>
    </div>

    <!-- KPI cards row -->
    <div class="grid mb-4">
      <!-- Active sensors -->
      <div class="col-12 md:col-6 lg:col-3">
        <pv-card>
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <p class="text-sm text-color-secondary m-0 mb-1">{{ t('dashboard.activeSensors') }}</p>
                <p class="text-4xl font-bold m-0" style="color: var(--color-text); line-height: 1.1;">{{ sensorsLoaded ? activeSensors : '—' }}</p>
                <p class="text-xs text-color-secondary mt-1 mb-0">{{ t('dashboard.ofTotal', { n: sensors.length }) }}</p>
              </div>
              <i class="pi pi-wifi" style="font-size: 2.2rem; color: var(--color-cobalt); opacity: 0.8;"></i>
            </div>
          </template>
        </pv-card>
      </div>

      <!-- Critical alerts -->
      <div class="col-12 md:col-6 lg:col-3">
        <pv-card>
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <p class="text-sm text-color-secondary m-0 mb-1">{{ t('dashboard.criticalAlerts') }}</p>
                <p class="text-4xl font-bold m-0" :style="{ color: criticalAlerts > 0 ? '#ef4444' : '#10B981', lineHeight: '1.1' }">
                  {{ alertsLoaded ? criticalAlerts : '—' }}
                </p>
                <p class="text-xs text-color-secondary mt-1 mb-0">{{ criticalAlerts > 0 ? t('dashboard.requiresAttention') : t('dashboard.noCriticalAlerts') }}</p>
              </div>
              <i class="pi pi-bell" :style="{ fontSize: '2.2rem', color: criticalAlerts > 0 ? '#ef4444' : '#10B981', opacity: '0.8' }"></i>
            </div>
          </template>
        </pv-card>
      </div>

      <!-- Treated volume (static mock) -->
      <div class="col-12 md:col-6 lg:col-3">
        <pv-card>
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <p class="text-sm text-color-secondary m-0 mb-1">{{ t('dashboard.treatedVolume') }}</p>
                <p class="text-4xl font-bold m-0" style="color: var(--color-text); line-height: 1.1;">12,540 <span style="font-size:1rem">m³</span></p>
                <p class="text-xs mt-1 mb-0" style="color: var(--color-emerald);">+4.2% {{ t('dashboard.vsYesterday') }}</p>
              </div>
              <i class="pi pi-cloud" style="font-size: 2.2rem; color: var(--color-emerald); opacity: 0.8;"></i>
            </div>
          </template>
        </pv-card>
      </div>

      <!-- Efficiency (static mock) -->
      <div class="col-12 md:col-6 lg:col-3">
        <pv-card>
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <p class="text-sm text-color-secondary m-0 mb-1">{{ t('dashboard.efficiency') }}</p>
                <p class="text-4xl font-bold m-0" style="color: var(--color-emerald); line-height: 1.1;">92%</p>
                <p class="text-xs text-color-secondary mt-1 mb-0">{{ t('dashboard.optimal') }}</p>
              </div>
              <i class="pi pi-check-circle" style="font-size: 2.2rem; color: var(--color-emerald); opacity: 0.8;"></i>
            </div>
          </template>
        </pv-card>
      </div>
    </div>

    <!-- Bottom row: sensors table + system status + alerts -->
    <div class="grid">

      <!-- Sensors mini table -->
      <div class="col-12 lg:col-7">
        <pv-card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>{{ t('dashboard.realtimeMonitor') }}</span>
              <pv-button
                  :label="t('dashboard.viewFullMap')"
                  text
                  size="small"
                  icon="pi pi-external-link"
                  @click="router.push('/monitoring/sensors')"
              />
            </div>
          </template>
          <template #content>
            <pv-data-table
                :value="sensors"
                :loading="!sensorsLoaded"
                :rows="5"
                table-style="min-width: 100%"
            >
              <pv-column field="name"         header="Sensor"    />
              <pv-column field="type"         header="Tipo"      />
              <pv-column header="Valor">
                <template #body="{ data }">
                  {{ data.currentValue }} {{ data.unit }}
                </template>
              </pv-column>
              <pv-column header="Estado">
                <template #body="{ data }">
                  <pv-tag
                      :value="data.status"
                      :severity="data.status === 'Normal' ? 'success' : data.status === 'Advertencia' ? 'warn' : 'danger'"
                  />
                </template>
              </pv-column>
            </pv-data-table>
          </template>
        </pv-card>
      </div>

      <!-- System status + alerts + subscription -->
      <div class="col-12 lg:col-5 flex flex-column gap-3">

        <!-- System status -->
        <pv-card>
          <template #title>{{ t('dashboard.systemStatus') }}</template>
          <template #content>
            <div class="flex align-items-start gap-3">
              <i
                  class="pi mt-1"
                  :class="systemOk ? 'pi-check-circle' : 'pi-exclamation-circle'"
                  :style="{ color: systemOk ? '#10B981' : '#ef4444', fontSize: '1.8rem' }"
              ></i>
              <div>
                <p class="font-semibold m-0">{{ systemOk ? t('dashboard.allOperational') : t('dashboard.requiredAttendance') }}</p>
                <p class="text-sm text-color-secondary mt-1">{{ t('dashboard.operatingNormally') }}</p>
                <ul class="mt-2 pl-3 text-sm">
                  <li>{{ t('dashboard.operatingPoints', { n: sensorsLoaded ? activeSensors : '…', total: sensors.length }) }}</li>
                  <li>{{ t('dashboard.activePumps') }}</li>
                  <li>{{ t('dashboard.energyConsumption') }}</li>
                </ul>
              </div>
            </div>
          </template>
        </pv-card>

        <!-- Recent alerts -->
        <pv-card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>{{ t('dashboard.recentAlerts') }}</span>
              <pv-button :label="t('dashboard.viewAll')" text size="small" @click="router.push('/monitoring/alerts')" />
            </div>
          </template>
          <template #content>
            <div v-if="!alertsLoaded" class="text-center">
              <i class="pi pi-spin pi-spinner"></i>
            </div>
            <div v-else-if="recentAlerts.length === 0" class="text-color-secondary text-sm">
              Sin alertas recientes.
            </div>
            <div v-else class="flex flex-column gap-2">
              <div
                  v-for="alert in recentAlerts"
                  :key="alert.id"
                  class="flex align-items-start gap-2 pb-2"
                  style="border-bottom: 1px solid #f1f5f9;"
              >
                <i
                    :class="severityIcon(alert.severity)"
                    :style="{ color: alert.severity === 'Crítica' ? '#ef4444' : '#f59e0b', fontSize: '1.1rem' }"
                ></i>
                <div class="flex-1">
                  <p class="m-0 text-sm font-medium">{{ alert.message }}</p>
                  <p class="m-0 text-xs text-color-secondary">{{ alert.sensorName }} · {{ alert.location }}</p>
                </div>
                <pv-tag
                    :value="alert.severity"
                    :severity="severityColor(alert.severity)"
                    class="ml-2"
                />
              </div>
            </div>
          </template>
        </pv-card>

        <!-- Current plan -->
        <pv-card v-if="subscriptionLoaded && subscription">
          <template #title>{{ t('dashboard.currentPlan') }}</template>
          <template #content>
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-crown" style="color: var(--color-cobalt); font-size: 1.3rem;"></i>
              <span class="font-semibold">{{ subscription.plan }}</span>
            </div>
            <p v-if="currentPlan" class="text-sm text-color-secondary m-0">
              S/ {{ currentPlan.monthlyCost.toFixed(2) }} / {{ t('subscription.monthly') }}
            </p>
            <pv-button
                :label="t('dashboard.viewSubscription')"
                text
                size="small"
                class="mt-2 p-0"
                @click="router.push('/monitoring/subscription')"
            />
          </template>
        </pv-card>

      </div>
    </div>
  </div>
</template>

<style scoped>
</style>