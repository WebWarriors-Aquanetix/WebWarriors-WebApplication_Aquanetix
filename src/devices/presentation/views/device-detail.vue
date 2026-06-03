<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import useMonitoringStore from '../../../monitoring/application/monitoring.store.js';
import { Alert } from '../../../monitoring/domain/model/alert.entity.js';
import { onMounted, computed, toRefs, ref } from 'vue';

const { t }  = useI18n();
const router = useRouter();
const route  = useRoute();
const store  = useMonitoringStore();
const { sensorsLoaded } = toRefs(store);
const { fetchSensors, updateSensor, resolveAlertBySensorName, addAlert } = store;

// ── Threshold dialog ────────────────────────────────────────────
const showThresholdDialog = ref(false);
const thresholdForm = ref({ minAlert: 0, maxAlert: 0 });

const openThresholdDialog = () => {
  thresholdForm.value.minAlert = sensor.value.minAlert;
  thresholdForm.value.maxAlert = sensor.value.maxAlert;
  showThresholdDialog.value = true;
};

const calcStatus = (value, min, max) => {
  if (value < min || value > max) return 'Alerta';
  const margin = (max - min) * 0.1;
  if (value <= min + margin || value >= max - margin) return 'Advertencia';
  return 'Normal';
};

const saveThresholds = () => {
  const min    = Number(thresholdForm.value.minAlert);
  const max    = Number(thresholdForm.value.maxAlert);
  const cv     = sensor.value.currentValue;
  const status = calcStatus(cv, min, max);

  const updated = {
    ...sensor.value,
    minAlert:         min,
    maxAlert:         max,
    recommendedRange: `${min} - ${max} ${sensor.value.unit}`,
    status,
    lastUpdated:      new Date().toISOString(),
  };

  updateSensor(updated);

  // Gestionar alertas según nuevo estado
  resolveAlertBySensorName(sensor.value.name);
  if (status === 'Alerta' || status === 'Advertencia') {
    addAlert(new Alert({
      sensorName: sensor.value.name,
      location:   sensor.value.location,
      type:       sensor.value.type,
      severity:   status === 'Alerta' ? 'Crítica' : 'Advertencia',
      message:    status === 'Alerta'
          ? `El sensor ${sensor.value.name} (${sensor.value.type}) superó el umbral permitido.`
          : `El sensor ${sensor.value.name} (${sensor.value.type}) se encuentra cerca del límite.`,
      timestamp:  new Date().toISOString(),
      status:     'Activa',
      value:      cv,
      threshold:  cv < min ? min : max,
    }));
  }

  showThresholdDialog.value = false;
};

onMounted(() => {
  if (!store.sensorsLoaded) fetchSensors();
});

const sensor = computed(() => store.getSensorById(route.params.id));

const statusSeverity = (status) => {
  if (status === 'Normal')      return 'success';
  if (status === 'Advertencia') return 'warn';
  return 'danger';
};

const historyMin = computed(() => sensor.value ? Math.min(...sensor.value.history) : 0);
const historyMax = computed(() => sensor.value ? Math.max(...sensor.value.history) : 0);
const historyAvg = computed(() => {
  if (!sensor.value || !sensor.value.history.length) return 0;
  const sum = sensor.value.history.reduce((a, b) => a + b, 0);
  return (sum / sensor.value.history.length).toFixed(2);
});

// Fix 4: gráfico mejorado con colores según umbrales y etiquetas de hora
const chartBars = computed(() => {
  if (!sensor.value) return [];
  const vals     = sensor.value.history;
  // El techo del eje es el mayor entre maxAlert y el valor máximo, +15% de margen
  const axisTop  = Math.max(historyMax.value, sensor.value.maxAlert) * 1.15 || 1;
  const lastIdx  = vals.length - 1;

  return vals.map((v, i) => {
    // Color según si está dentro/fuera del rango de alerta
    let color = '#007BFF'; // normal
    if (v <= sensor.value.minAlert || v >= sensor.value.maxAlert) {
      color = '#ef4444'; // fuera de rango
    } else if (
        v <= sensor.value.minAlert * 1.15 ||
        v >= sensor.value.maxAlert * 0.90
    ) {
      color = '#f59e0b'; // cerca del límite
    }

    const hoursAgo = lastIdx - i;
    const label = hoursAgo === 0 ? t('sensorDetail.now') : `-${hoursAgo}h`;

    return {
      value: v,
      heightPct: Math.max(4, Math.round((v / axisTop) * 100)),
      color,
      label,
      isLast: i === lastIdx
    };
  });
});

// Posición % en el eje Y de las líneas de referencia
const refLines = computed(() => {
  if (!sensor.value) return { min: 0, max: 100 };
  const axisTop = Math.max(historyMax.value, sensor.value.maxAlert) * 1.15 || 1;
  return {
    min: Math.round((sensor.value.minAlert / axisTop) * 100),
    max: Math.round((sensor.value.maxAlert / axisTop) * 100),
  };
});
</script>

<template>
  <div class="p-4">
    <pv-button
        :label="t('sensorDetail.back')"
        icon="pi pi-arrow-left"
        text
        class="mb-3"
        @click="router.push('/devices')"
    />

    <div v-if="!sensorsLoaded" class="flex justify-content-center py-6">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
    </div>

    <div v-else-if="!sensor" class="text-center py-6">
      <p class="text-color-secondary">{{ t('sensorDetail.notFound') }}</p>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="flex align-items-start justify-content-between flex-wrap gap-3 mb-4">
        <div>
          <h1 class="text-4xl font-bold mt-1 mb-1" style="font-family: 'Manrope', sans-serif;">{{ sensor.name }}</h1>
          <p class="text-sm text-color-secondary m-0">
            {{ sensor.location }} · Tipo: {{ sensor.type }}
          </p>
        </div>
        <div class="flex align-items-center gap-2">
          <pv-tag :value="sensor.status" :severity="statusSeverity(sensor.status)" />
          <pv-button :label="t('sensorDetail.exportData')" icon="pi pi-download" outlined size="small" />
        </div>
      </div>

      <div class="grid">
        <!-- Columna izquierda: valor actual + gráfico -->
        <div class="col-12 lg:col-8">

          <pv-card class="mb-3">
            <template #content>
              <p class="text-sm text-color-secondary mb-1">{{ t('sensorDetail.currentValue') }}</p>
              <p class="m-0" style="font-size: 3.5rem; font-weight: 700; color: #007BFF; line-height: 1;">
                {{ sensor.currentValue }}
                <span style="font-size: 1.4rem; font-weight: 400; color: #64748b;">{{ sensor.unit }}</span>
              </p>
              <pv-tag :value="sensor.status" :severity="statusSeverity(sensor.status)" class="mt-2" />
            </template>
          </pv-card>

          <!-- Fix 4: Gráfico con colores semánticos + líneas de umbral + etiquetas de hora -->
          <pv-card>
            <template #title>{{ t('sensorDetail.history24h') }}</template>
            <template #content>

              <!-- Leyenda -->
              <div class="flex gap-4 mb-3">
                <div class="flex align-items-center gap-1">
                  <div style="width:12px;height:12px;border-radius:2px;background:#007BFF;"></div>
                  <span class="text-xs text-color-secondary">Normal</span>
                </div>
                <div class="flex align-items-center gap-1">
                  <div style="width:12px;height:12px;border-radius:2px;background:#f59e0b;"></div>
                  <span class="text-xs text-color-secondary">Cerca del límite</span>
                </div>
                <div class="flex align-items-center gap-1">
                  <div style="width:12px;height:12px;border-radius:2px;background:#ef4444;"></div>
                  <span class="text-xs text-color-secondary">Fuera del rango</span>
                </div>
              </div>

              <!-- Área del gráfico con líneas de referencia -->
              <div style="position: relative; height: 160px; padding: 8px 0 4px;">

                <!-- Línea máximo de alerta -->
                <div :style="{
                                    position: 'absolute',
                                    bottom: refLines.max + '%',
                                    left: 0, right: '62px',
                                    height: '1px',
                                    background: '#ef4444',
                                    opacity: 0.6
                                }">
                                    <span style="position:absolute;right:-60px;top:-10px;font-size:0.62rem;color:#ef4444;font-weight:700;white-space:nowrap;">
                                        Máx {{ sensor.maxAlert }} {{ sensor.unit }}
                                    </span>
                </div>

                <!-- Línea mínimo de alerta -->
                <div :style="{
                                    position: 'absolute',
                                    bottom: refLines.min + '%',
                                    left: 0, right: '62px',
                                    height: '1px',
                                    background: '#3b82f6',
                                    opacity: 0.6
                                }">
                                    <span style="position:absolute;right:-60px;top:-10px;font-size:0.62rem;color:#3b82f6;font-weight:700;white-space:nowrap;">
                                        Mín {{ sensor.minAlert }} {{ sensor.unit }}
                                    </span>
                </div>

                <!-- Barras -->
                <div style="display:flex;align-items:flex-end;gap:4px;height:100%;padding-right:66px;">
                  <div
                      v-for="(bar, i) in chartBars"
                      :key="i"
                      style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;"
                      :title="`${bar.label}: ${bar.value} ${sensor.unit}`"
                  >
                    <!-- Punto indicador de la lectura más reciente -->
                    <div
                        v-if="bar.isLast"
                        :style="{
                                                width:'8px', height:'8px',
                                                borderRadius:'50%',
                                                background: bar.color,
                                                border: '2px solid white',
                                                boxShadow: '0 0 0 2px ' + bar.color,
                                                marginBottom: '2px'
                                            }"
                    ></div>
                    <div :style="{
                                            width: '100%',
                                            minHeight: '4px',
                                            borderRadius: '4px 4px 0 0',
                                            height: bar.heightPct + '%',
                                            background: bar.color,
                                            opacity: bar.isLast ? 1 : 0.75,
                                            transition: 'height 0.3s'
                                        }"></div>
                  </div>
                </div>
              </div>

              <!-- Eje X con etiquetas de hora -->
              <div style="display:flex;gap:4px;padding-right:66px;margin-top:4px;">
                <div
                    v-for="(bar, i) in chartBars"
                    :key="i"
                    style="flex:1;text-align:center;"
                >
                                    <span :style="{
                                        fontSize: '0.65rem',
                                        color: bar.isLast ? '#007BFF' : '#94a3b8',
                                        fontWeight: bar.isLast ? '700' : '400'
                                    }">{{ bar.label }}</span>
                </div>
              </div>

              <!-- Pie del gráfico: rango recomendado y última lectura -->
              <div class="flex justify-content-between mt-3">
                                <span class="text-xs text-color-secondary">
                                    {{ t('sensorDetail.recommendedRangeLabel') }}: <strong>{{ sensor.recommendedRange }} {{ sensor.unit }}</strong>
                                </span>
                <span class="text-xs text-color-secondary">
                                    {{ sensor.history.length }} {{ t('sensorDetail.readings') }} · {{ t('sensorDetail.latest') }}:
                                    <strong>{{ sensor.currentValue }} {{ sensor.unit }}</strong>
                                </span>
              </div>

            </template>
          </pv-card>
        </div>

        <!-- Columna derecha: info panels -->
        <div class="col-12 lg:col-4 flex flex-column gap-3">

          <pv-card>
            <template #title>{{ t('sensorDetail.sensorInfo') }}</template>
            <template #content>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 4px;">
                <span class="text-xs text-color-secondary">{{ t('sensorDetail.sensorId') }}</span>
                <span class="text-sm font-medium">{{ sensor.name }}</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.locationLabel') }}</span>
                <span class="text-sm font-medium">{{ sensor.location }}</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.typeLabel') }}</span>
                <span class="text-sm font-medium">{{ sensor.type }}</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.recommendedRange') }}</span>
                <span class="text-sm font-medium">{{ sensor.recommendedRange }} {{ sensor.unit }}</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.statusLabel') }}</span>
                <span class="text-sm">
                                    <pv-tag :value="sensor.status" :severity="statusSeverity(sensor.status)" />
                                </span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.installedOn') }}</span>
                <span class="text-sm font-medium">15/03/2024</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.lastMaintenance') }}</span>
                <span class="text-sm font-medium">02/05/2024</span>
              </div>
            </template>
          </pv-card>

          <pv-card>
            <template #title>{{ t('sensorDetail.valueSummary') }}</template>
            <template #content>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 4px;">
                <span class="text-xs text-color-secondary">{{ t('sensorDetail.minimum') }}</span>
                <span class="text-sm font-bold">{{ historyMin }} {{ sensor.unit }}</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.maximum') }}</span>
                <span class="text-sm font-bold">{{ historyMax }} {{ sensor.unit }}</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.average') }}</span>
                <span class="text-sm font-bold">{{ historyAvg }} {{ sensor.unit }}</span>
              </div>
            </template>
          </pv-card>

          <pv-card>
            <template #title>{{ t('sensorDetail.configuredThresholds') }}</template>
            <template #content>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 4px;" class="mb-3">
                <span class="text-xs text-color-secondary">{{ t('sensorDetail.minAlert') }}</span>
                <span class="text-sm font-medium" style="color:#3b82f6;">{{ sensor.minAlert }} {{ sensor.unit }}</span>

                <span class="text-xs text-color-secondary">{{ t('sensorDetail.maxAlert') }}</span>
                <span class="text-sm font-medium" style="color:#ef4444;">{{ sensor.maxAlert }} {{ sensor.unit }}</span>
              </div>
              <pv-button
                  :label="t('sensorDetail.editThresholds')"
                  icon="pi pi-pencil"
                  outlined
                  size="small"
                  class="w-full"
                  @click="openThresholdDialog"
              />

              <!-- Dialog editar umbrales -->
              <pv-dialog
                  v-model:visible="showThresholdDialog"
                  :header="t('sensorDetail.editThresholdsTitle')"
                  :modal="true"
                  :style="{ width: '360px' }"
              >
                <div class="flex flex-column gap-3 pt-2">
                  <div class="field">
                    <label class="font-medium mb-1 block" style="color:#3b82f6;">
                      <i class="pi pi-arrow-down mr-1"></i> Umbral mínimo ({{ sensor.unit }})
                    </label>
                    <pv-input-number
                        v-model="thresholdForm.minAlert"
                        class="w-full"
                        :min="0"
                        :max-fraction-digits="2"
                    />
                  </div>
                  <div class="field">
                    <label class="font-medium mb-1 block" style="color:#ef4444;">
                      <i class="pi pi-arrow-up mr-1"></i> Umbral máximo ({{ sensor.unit }})
                    </label>
                    <pv-input-number
                        v-model="thresholdForm.maxAlert"
                        class="w-full"
                        :min="0"
                        :max-fraction-digits="2"
                    />
                  </div>
                  <p class="text-xs text-color-secondary m-0">
                    Valor actual: <strong>{{ sensor.currentValue }} {{ sensor.unit }}</strong>.
                    El estado se recalculará automáticamente.
                  </p>
                </div>
                <template #footer>
                  <pv-button :label="t('option.cancel')" text @click="showThresholdDialog = false" />
                  <pv-button :label="t('sensorDetail.saveThresholds')" icon="pi pi-save" @click="saveThresholds" />
                </template>
              </pv-dialog>
            </template>
          </pv-card>

        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
</style>