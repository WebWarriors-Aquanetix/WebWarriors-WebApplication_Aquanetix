<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useMonitoringStore from '../../../monitoring/application/monitoring.store.js';
import useSubscriptionStore from '../../../subscriptions/application/subscription.store.js';
import useDashboardStore from '../../application/dashboard.store.js';
import { onMounted, toRefs, computed, ref } from 'vue';

const { t } = useI18n();
const router = useRouter();
const store = useMonitoringStore();
const subscriptionStore = useSubscriptionStore();
const dashboardStore = useDashboardStore();
const { sensors, alerts, sensorsLoaded, alertsLoaded } = toRefs(store);
const { subscription, plans, subscriptionLoaded } = toRefs(subscriptionStore);
const { qualityAnalysesLoaded, totalAnalyses, averageSeverity, contaminationPredictions, recentAnalyses } = toRefs(dashboardStore);
const { fetchSensors, fetchAlerts } = store;
const { fetchSubscription, fetchPlans } = subscriptionStore;
const {
  fetchQualityAnalyses,
  createQualityAnalysis,
  evaluateQualityAnalysis,
  confirmQualityAnalysis,
  dismissQualityAnalysis
} = dashboardStore;

const showQualityAnalysisDialog = ref(false);
const qualityAnalysisSaving = ref(false);
const qualityAnalysisStatusAction = ref(null);
const qualityAnalysisForm = ref({
  sensorSourceId: null,
  detectedParameters: null,
  severityScore: 5
});

const anomalyTypeKeys = [
  'PH',
  'Turbidity',
  'Pressure',
  'Level',
  'Chlorine',
  'Flow',
  'DissolvedOxygen',
  'Temperature'
];

onMounted(() => {
  if (!store.sensorsLoaded)      fetchSensors();
  if (!store.alertsLoaded)       fetchAlerts();
  if (!subscriptionStore.subscriptionLoaded) fetchSubscription();
  if (!subscriptionStore.plansLoaded)        fetchPlans();
  if (!dashboardStore.qualityAnalysesLoaded) fetchQualityAnalyses();
});

// Cross the current subscription's plan with the real catalog to get its price.
const currentPlan = computed(() =>
  plans.value.find(p => p.name === subscription.value?.plan) ?? null);

const activeSensors  = computed(() => sensors.value.filter(s => s.status !== 'Alerta').length);
const criticalAlerts = computed(() => alerts.value.filter(a => a.severity === 'Crítica' && a.status === 'Activa').length);
const recentAlerts   = computed(() => alerts.value.slice(0, 3));
const formattedAverageSeverity = computed(() => averageSeverity.value.toFixed(1));
const sensorOptions = computed(() =>
  sensors.value.map(sensor => ({
    label: `${sensor.name ?? t('dashboard.sensor')} #${sensor.id}`,
    value: Number(sensor.id)
  }))
);
const anomalyTypeOptions = computed(() =>
  anomalyTypeKeys.map(value => ({
    label: qualityParameterLabel(value),
    value
  }))
);
const canCreateQualityAnalysis = computed(() =>
  Boolean(qualityAnalysisForm.value.sensorSourceId)
  && Boolean(qualityAnalysisForm.value.detectedParameters)
  && qualityAnalysisForm.value.severityScore !== null
  && qualityAnalysisForm.value.severityScore !== undefined
);

const systemOk = computed(() => criticalAlerts.value === 0);

const severityColor = (severity) => severity === 'Crítica' ? 'danger' : 'warn';
const severityIcon  = (severity) => severity === 'Crítica' ? 'pi pi-times-circle' : 'pi pi-exclamation-triangle';

function qualityParameterLabel(parameter) {
  const labels = {
    PH: t('dashboard.parameterPH'),
    Turbidity: t('dashboard.parameterTurbidity'),
    Pressure: t('dashboard.parameterPressure'),
    Level: t('dashboard.parameterLevel'),
    Chlorine: t('dashboard.parameterChlorine'),
    Flow: t('dashboard.parameterFlow'),
    DissolvedOxygen: t('dashboard.parameterDissolvedOxygen'),
    Temperature: t('dashboard.parameterTemperature')
  };
  return labels[parameter] ?? parameter;
}

function qualityStatusLabel(status) {
  const labels = {
    Detected: t('dashboard.statusDetected'),
    Evaluated: t('dashboard.statusEvaluated'),
    Confirmed: t('dashboard.statusConfirmed'),
    Dismissed: t('dashboard.statusDismissed')
  };
  return labels[status] ?? status;
}

function qualityStatusSeverity(status) {
  const severities = {
    Detected: 'warn',
    Evaluated: 'info',
    Confirmed: 'danger',
    Dismissed: 'success'
  };
  return severities[status] ?? 'secondary';
}

function qualityRiskLabel(analysis) {
  if (analysis.hasContaminationPeakPrediction) return t('dashboard.riskDetected');
  const severity = Number(analysis.severityScore ?? 0);
  if (severity >= 8) return t('dashboard.riskHighSeverity');
  if (severity >= 5) return t('dashboard.riskNeedsMonitoring');
  return t('dashboard.riskNotFlagged');
}

function qualityRiskSeverity(analysis) {
  if (analysis.hasContaminationPeakPrediction) return 'danger';
  const severity = Number(analysis.severityScore ?? 0);
  if (severity >= 8) return 'danger';
  if (severity >= 5) return 'warn';
  return 'success';
}

function severityScoreSeverity(score) {
  const value = Number(score ?? 0);
  if (value >= 8) return 'danger';
  if (value >= 5) return 'warn';
  return 'success';
}

function sensorLabelForAnalysis(analysis) {
  const sensor = sensors.value.find(item => Number(item.id) === Number(analysis.sensorSourceId));
  return sensor?.name ? `${sensor.name} #${analysis.sensorSourceId}` : `#${analysis.sensorSourceId}`;
}

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });
};

const resetQualityAnalysisForm = () => {
  qualityAnalysisForm.value = {
    sensorSourceId: sensorOptions.value[0]?.value ?? null,
    detectedParameters: 'PH',
    severityScore: 5
  };
};

const openQualityAnalysisDialog = () => {
  resetQualityAnalysisForm();
  showQualityAnalysisDialog.value = true;
};

const submitQualityAnalysis = async () => {
  if (!canCreateQualityAnalysis.value) return;
  qualityAnalysisSaving.value = true;
  try {
    await createQualityAnalysis({
      sensorSourceId: Number(qualityAnalysisForm.value.sensorSourceId),
      detectedParameters: qualityAnalysisForm.value.detectedParameters,
      severityScore: Number(qualityAnalysisForm.value.severityScore)
    });
    showQualityAnalysisDialog.value = false;
  } finally {
    qualityAnalysisSaving.value = false;
  }
};

const updateQualityAnalysisStatus = async (analysis, action) => {
  qualityAnalysisStatusAction.value = `${analysis.id}-${action}`;
  try {
    if (action === 'evaluate') await evaluateQualityAnalysis(analysis.id);
    if (action === 'confirm') await confirmQualityAnalysis(analysis.id);
    if (action === 'dismiss') await dismissQualityAnalysis(analysis.id);
  } catch (error) {
    console.error('Could not update quality analysis status', error);
  } finally {
    qualityAnalysisStatusAction.value = null;
  }
};

const isQualityAnalysisActionLoading = (analysis, action) =>
    qualityAnalysisStatusAction.value === `${analysis.id}-${action}`;
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



      <!-- Quality analyses -->
      <div class="col-12 md:col-6 lg:col-3">
        <pv-card>
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <p class="text-sm text-color-secondary m-0 mb-1">{{ t('dashboard.qualityAnalyses') }}</p>
                <p class="text-4xl font-bold m-0" style="color: var(--color-text); line-height: 1.1;">
                  {{ qualityAnalysesLoaded ? totalAnalyses : '-' }}
                </p>
                <p class="text-xs text-color-secondary mt-1 mb-0">{{ t('dashboard.recordsProcessed') }}</p>
              </div>
              <i class="pi pi-chart-line" style="font-size: 2.2rem; color: var(--color-cobalt); opacity: 0.8;"></i>
            </div>
          </template>
        </pv-card>
      </div>

      <!-- Contamination predictions -->
      <div class="col-12 md:col-6 lg:col-3">
        <pv-card>
          <template #content>
            <div class="flex align-items-center justify-content-between">
              <div>
                <p class="text-sm text-color-secondary m-0 mb-1">{{ t('dashboard.contaminationPredictions') }}</p>
                <p class="text-4xl font-bold m-0" :style="{ color: contaminationPredictions > 0 ? '#ef4444' : '#10B981', lineHeight: '1.1' }">
                  {{ qualityAnalysesLoaded ? contaminationPredictions : '-' }}
                </p>
                <p class="text-xs text-color-secondary mt-1 mb-0">{{ t('dashboard.averageSeverity', { value: qualityAnalysesLoaded ? formattedAverageSeverity : '-' }) }}</p>
              </div>
              <i class="pi pi-exclamation-triangle" :style="{ fontSize: '2.2rem', color: contaminationPredictions > 0 ? '#ef4444' : '#10B981', opacity: '0.8' }"></i>
            </div>
          </template>
        </pv-card>
      </div>

    </div>

    <!-- Quality analysis row -->
    <div class="grid mb-4">
      <div class="col-12">
        <pv-card>
          <template #title>
            <div class="flex align-items-center justify-content-between gap-3">
              <span>{{ t('dashboard.recentQualityFindings') }}</span>
              <pv-button
                  :label="t('dashboard.registerQualityFinding')"
                  icon="pi pi-plus"
                  size="small"
                  @click="openQualityAnalysisDialog"
              />
            </div>
          </template>
          <template #content>
            <pv-data-table
                :value="recentAnalyses"
                :loading="!qualityAnalysesLoaded"
                :rows="5"
                table-style="min-width: 100%"
            >
              <pv-column :header="t('dashboard.sourceDevice')">
                <template #body="{ data }">
                  {{ sensorLabelForAnalysis(data) }}
                </template>
              </pv-column>
              <pv-column :header="t('dashboard.evaluatedParameter')">
                <template #body="{ data }">
                  {{ qualityParameterLabel(data.detectedParameters) }}
                </template>
              </pv-column>
              <pv-column :header="t('dashboard.severity')">
                <template #body="{ data }">
                  <pv-tag
                      :value="`${Number(data.severityScore ?? 0).toFixed(1)} / 10`"
                      :severity="severityScoreSeverity(data.severityScore)"
                  />
                </template>
              </pv-column>
              <pv-column :header="t('dashboard.reviewStatus')">
                <template #body="{ data }">
                  <pv-tag
                      :value="qualityStatusLabel(data.anomalyStatus)"
                      :severity="qualityStatusSeverity(data.anomalyStatus)"
                  />
                </template>
              </pv-column>
              <pv-column :header="t('dashboard.contaminationRisk')">
                <template #body="{ data }">
                  <pv-tag
                      :value="qualityRiskLabel(data)"
                      :severity="qualityRiskSeverity(data)"
                  />
                </template>
              </pv-column>
              <pv-column :header="t('dashboard.actions')">
                <template #body="{ data }">
                  <div class="flex flex-wrap gap-2">
                    <pv-button
                        :label="t('dashboard.evaluate')"
                        icon="pi pi-search"
                        size="small"
                        text
                        :loading="isQualityAnalysisActionLoading(data, 'evaluate')"
                        :disabled="data.anomalyStatus === 'Evaluated'"
                        @click="updateQualityAnalysisStatus(data, 'evaluate')"
                    />
                    <pv-button
                        :label="t('dashboard.confirm')"
                        icon="pi pi-check"
                        size="small"
                        text
                        severity="danger"
                        :loading="isQualityAnalysisActionLoading(data, 'confirm')"
                        :disabled="data.anomalyStatus === 'Confirmed'"
                        @click="updateQualityAnalysisStatus(data, 'confirm')"
                    />
                    <pv-button
                        :label="t('dashboard.dismiss')"
                        icon="pi pi-times"
                        size="small"
                        text
                        severity="secondary"
                        :loading="isQualityAnalysisActionLoading(data, 'dismiss')"
                        :disabled="data.anomalyStatus === 'Dismissed'"
                        @click="updateQualityAnalysisStatus(data, 'dismiss')"
                    />
                  </div>
                </template>
              </pv-column>
              <pv-column :header="t('dashboard.createdAt')">
                <template #body="{ data }">
                  {{ formatDate(data.createdAt) }}
                </template>
              </pv-column>
            </pv-data-table>
          </template>
        </pv-card>
      </div>
    </div>

    <pv-dialog
        v-model:visible="showQualityAnalysisDialog"
        :header="t('dashboard.registerQualityFinding')"
        modal
        :style="{ width: '32rem', maxWidth: '94vw' }"
    >
      <div class="flex flex-column gap-3">
        <div class="flex flex-column gap-2">
          <label class="text-sm font-medium">{{ t('dashboard.sensor') }}</label>
          <pv-select
              v-model="qualityAnalysisForm.sensorSourceId"
              :options="sensorOptions"
              option-label="label"
              option-value="value"
              :placeholder="t('dashboard.selectSensor')"
              class="w-full"
          />
        </div>
        <div class="flex flex-column gap-2">
          <label class="text-sm font-medium">{{ t('dashboard.evaluatedParameter') }}</label>
          <pv-select
              v-model="qualityAnalysisForm.detectedParameters"
              :options="anomalyTypeOptions"
              option-label="label"
              option-value="value"
              class="w-full"
          />
        </div>
        <div class="flex flex-column gap-2">
          <label class="text-sm font-medium">{{ t('dashboard.severity') }}</label>
          <pv-input-number
              v-model="qualityAnalysisForm.severityScore"
              :min="0"
              :max="10"
              :min-fraction-digits="0"
              :max-fraction-digits="2"
              class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex justify-content-end gap-2">
          <pv-button
              :label="t('option.cancel')"
              text
              @click="showQualityAnalysisDialog = false"
          />
          <pv-button
              :label="t('dashboard.createFinding')"
              icon="pi pi-check"
              :loading="qualityAnalysisSaving"
              :disabled="!canCreateQualityAnalysis"
              @click="submitQualityAnalysis"
          />
        </div>
      </template>
    </pv-dialog>

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
