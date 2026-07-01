import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { MonitoringApi } from '../infrastructure/monitoring-api.js';
import { SensorAssembler } from '../infrastructure/sensor.assembler.js';
import { AlertAssembler } from '../infrastructure/alert.assembler.js';

const monitoringApi = new MonitoringApi();

const DEFAULT_SUBSCRIPTION_ID = import.meta.env.VITE_DEFAULT_SUBSCRIPTION_ID ?? '1';

const useMonitoringStore = defineStore('monitoring', () => {

    const sensors      = ref([]);
    const alerts       = ref([]);
    const subscription = ref(null);
    const plans        = ref([]);
    const errors       = ref([]);

    const sensorsLoaded      = ref(false);
    const alertsLoaded       = ref(false);
    const subscriptionLoaded = ref(false);
    const plansLoaded        = ref(false);

    const activeSensorsCount  = computed(() => sensors.value.filter(s => s.status !== 'Alerta').length);
    const criticalAlertsCount = computed(() => alerts.value.filter(a => a.severity === 'Crítica' && a.status === 'Activa').length);
    const activeAlerts        = computed(() => alerts.value.filter(a => a.status === 'Activa'));

    function fetchSensors() {
        monitoringApi.getSensors()
            .then(async response => {
                const list = SensorAssembler.toEntitiesFromResponse(response);
                // Enriquecer cada sensor con sus thresholds reales (best-effort)
                await Promise.all(list.map(async s => {
                    try {
                        const tRes = await monitoringApi.getThresholds(s.id);
                        SensorAssembler.applyThresholds(s, tRes.data);
                    } catch (_) { /* sin thresholds: se quedan en 0 */ }
                }));
                sensors.value = list;
                sensorsLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    function getSensorById(id) {
        return sensors.value.find(s => String(s.id) === String(id));
    }

    function addSensor(sensor) {
        const payload = SensorAssembler.toCreateResource(sensor);
        return monitoringApi.createSensor(payload)
            .then(async response => {
                const created = SensorAssembler.toEntityFromResource(response.data);
                // Si el form trajo umbrales, crearlos en el endpoint separado
                if (sensor.minAlert || sensor.maxAlert) {
                    try {
                        await monitoringApi.createThreshold(created.id, buildThresholdPayload(sensor));
                        SensorAssembler.applyThresholds(created, [{
                            minValue: Number(sensor.minAlert) || 0,
                            maxValue: Number(sensor.maxAlert) || 0,
                            unit: sensor.unit ?? '',
                        }]);
                    } catch (e) { errors.value.push(e); }
                }
                sensors.value.push(created);
                return created;
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    function updateSensor(sensor) {
        const payload = SensorAssembler.toUpdateResource(sensor);
        return monitoringApi.updateSensor({ id: sensor.id, ...payload })
            .then(async response => {
                const updated = SensorAssembler.toEntityFromResource(response.data);
                // Volver a registrar umbrales (el backend crea uno nuevo)
                if (sensor.minAlert || sensor.maxAlert) {
                    try {
                        await monitoringApi.createThreshold(updated.id, buildThresholdPayload(sensor));
                    } catch (e) { errors.value.push(e); }
                }
                SensorAssembler.applyThresholds(updated, [{
                    minValue: Number(sensor.minAlert) || 0,
                    maxValue: Number(sensor.maxAlert) || 0,
                    unit: sensor.unit ?? '',
                }]);
                const index = sensors.value.findIndex(s => String(s.id) === String(updated.id));
                if (index !== -1) sensors.value[index] = updated;
                return updated;
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    function buildThresholdPayload(sensor) {
        return {
            minValue:   Number(sensor.minAlert) || 0,
            maxValue:   Number(sensor.maxAlert) || 0,
            unit:       sensor.unit ?? '',
            // AlertLevel enum del backend: Warning | Critical
            alertLevel: sensor.status === 'Alerta' ? 'Critical' : 'Warning',
        };
    }

    function deleteSensor(id) {
        return monitoringApi.deleteSensor(id)
            .then(() => {
                sensors.value = sensors.value.filter(s => String(s.id) !== String(id));
                fetchAlerts(); // refresca alertas para reflejar la cascada del backend
            })
            .catch(error => { errors.value.push(error); throw error; });
    }

    function fetchAlerts() {
        monitoringApi.getAlerts()
            .then(response => {
                alerts.value = AlertAssembler.toEntitiesFromResponse(response);
                alertsLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    function addAlert(alert) {
        const payload = SensorAssembler ? AlertAssembler.toResource(alert) : alert;
        monitoringApi.createAlert(payload)
            .then(response => {
                const created = AlertAssembler.toEntityFromResource(response.data);
                alerts.value.push(created);
            })
            .catch(error => errors.value.push(error));
    }

    function resolveAlertBySensorName(sensorName) {
        const active = alerts.value.find(a => a.sensorName === sensorName && a.status === 'Activa');
        if (!active) return;
        const resolved = { ...active, status: 'Resuelta' };
        monitoringApi.updateAlert(AlertAssembler.toResource(resolved))
            .then(() => {
                const idx = alerts.value.findIndex(a => a.id === active.id);
                if (idx !== -1) alerts.value[idx] = { ...alerts.value[idx], status: 'Resuelta' };
            })
            .catch(error => errors.value.push(error));
    }

    function deleteAlertsBySensorName(sensorName) {
        // El backend no expone DELETE /alerts; quitamos localmente.
        alerts.value = alerts.value.filter(a => a.sensorName !== sensorName);
    }

    // ── Subscription ─────────────────────────────────────────────────────
    function fetchSubscription() {
        monitoringApi.getSubscriptionById(DEFAULT_SUBSCRIPTION_ID)
            .then(response => {
                subscription.value = response.data;
                subscriptionLoaded.value = true;
            })
            .catch(error => {
                errors.value.push(error);
                subscriptionLoaded.value = true; // evita spinner infinito
            });
    }

    function fetchPlans() {
        // El backend no expone catálogo de planes; usamos los planes conocidos del dominio.
        plans.value = [
            { id: 'basic',      name: 'Basic Monitoring Plan' },
            { id: 'smartcity',  name: 'Smart City Plan' },
            { id: 'industrial', name: 'Industrial Plan' },
        ];
        plansLoaded.value = true;
    }

    function updateSubscription(updated) {
        const id = subscription.value?.id ?? DEFAULT_SUBSCRIPTION_ID;
        // El backend solo soporta cancel/renew; reflejamos el cambio localmente.
        subscription.value = { ...subscription.value, ...updated, id };
    }

    return {
        sensors, alerts, subscription, plans, errors,
        sensorsLoaded, alertsLoaded, subscriptionLoaded, plansLoaded,
        activeSensorsCount, criticalAlertsCount, activeAlerts,
        fetchSensors, getSensorById, addSensor, updateSensor, deleteSensor,
        fetchAlerts, addAlert, resolveAlertBySensorName, deleteAlertsBySensorName,
        fetchSubscription, fetchPlans, updateSubscription
    };
});

export default useMonitoringStore;
