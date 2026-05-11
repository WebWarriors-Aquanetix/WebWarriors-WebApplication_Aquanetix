import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { MonitoringApi } from '../infrastructure/monitoring-api.js';
import { SensorAssembler } from '../infrastructure/sensor.assembler.js';
import { AlertAssembler } from '../infrastructure/alert.assembler.js';
import { Sensor } from '../domain/model/sensor.entity.js';

const monitoringApi = new MonitoringApi();

/**
 * Reactive store that exposes Monitoring commands and queries.
 * Follows the same pattern as publishing.store.js from the learning-center.
 */
const useMonitoringStore = defineStore('monitoring', () => {

    // ── State ──────────────────────────────────────────────────────────────
    const sensors      = ref([]);
    const alerts       = ref([]);
    const subscription = ref(null);
    const errors       = ref([]);

    const sensorsLoaded      = ref(false);
    const alertsLoaded       = ref(false);
    const subscriptionLoaded = ref(false);

    // ── Computed ───────────────────────────────────────────────────────────
    const activeSensorsCount  = computed(() => sensors.value.filter(s => s.status !== 'Alerta').length);
    const criticalAlertsCount = computed(() => alerts.value.filter(a => a.severity === 'Crítica' && a.status === 'Activa').length);
    const activeAlerts        = computed(() => alerts.value.filter(a => a.status === 'Activa'));

    // ── Actions ────────────────────────────────────────────────────────────

    function fetchSensors() {
        monitoringApi.getSensors()
            .then(response => {
                sensors.value = SensorAssembler.toEntitiesFromResponse(response);
                sensorsLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    function getSensorById(id) {
        const idNum = parseInt(id);
        return sensors.value.find(s => s.id === idNum);
    }

    /**
     * Creates a new sensor via the API and adds it to local state.
     * Follows the same pattern as addTutorial() in publishing.store.js.
     * @param {Sensor} sensor
     */
    function addSensor(sensor) {
        monitoringApi.createSensor(sensor)
            .then(response => {
                const created = SensorAssembler.toEntityFromResource(response.data);
                sensors.value.push(created);
            })
            .catch(error => errors.value.push(error));
    }

    /**
     * Updates an existing sensor via the API and refreshes local state.
     * Follows the same pattern as updateTutorial() in publishing.store.js.
     * @param {Sensor} sensor
     */
    function updateSensor(sensor) {
        monitoringApi.updateSensor(sensor)
            .then(response => {
                const updated = SensorAssembler.toEntityFromResource(response.data);
                const index = sensors.value.findIndex(s => s.id === updated.id);
                if (index !== -1) sensors.value[index] = updated;
            })
            .catch(error => errors.value.push(error));
    }

    function fetchAlerts() {
        monitoringApi.getAlerts()
            .then(response => {
                alerts.value = AlertAssembler.toEntitiesFromResponse(response);
                alertsLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    function fetchSubscription() {
        monitoringApi.getSubscription()
            .then(response => {
                const data = response.data;
                subscription.value = Array.isArray(data) ? data[0] : data;
                subscriptionLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    return {
        // state
        sensors, alerts, subscription, errors,
        sensorsLoaded, alertsLoaded, subscriptionLoaded,
        // computed
        activeSensorsCount, criticalAlertsCount, activeAlerts,
        // actions
        fetchSensors, getSensorById, addSensor, updateSensor,
        fetchAlerts, fetchSubscription
    };
});

export default useMonitoringStore;
