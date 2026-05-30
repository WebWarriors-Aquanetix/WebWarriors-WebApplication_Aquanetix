import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { MonitoringApi } from '../infrastructure/monitoring-api.js';
import { SensorAssembler } from '../infrastructure/sensor.assembler.js';
import { AlertAssembler } from '../infrastructure/alert.assembler.js';
import { Sensor } from '../domain/model/sensor.entity.js';
import { Alert } from '../domain/model/alert.entity.js';

const monitoringApi = new MonitoringApi();

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
            .then(response => {
                sensors.value = SensorAssembler.toEntitiesFromResponse(response);
                sensorsLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    function getSensorById(id) {
        return sensors.value.find(s => String(s.id) === String(id));
    }

    function addSensor(sensor) {
        monitoringApi.createSensor(sensor)
            .then(response => {
                const created = SensorAssembler.toEntityFromResource(response.data);
                sensors.value.push(created);
            })
            .catch(error => errors.value.push(error));
    }

    function updateSensor(sensor) {
        monitoringApi.updateSensor(sensor)
            .then(response => {
                const updated = SensorAssembler.toEntityFromResource(response.data);
                const index = sensors.value.findIndex(s => String(s.id) === String(updated.id));
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

    /**
     * Crea una alerta en la API y la agrega al estado local.
     * @param {Alert} alert
     */
    function addAlert(alert) {
        monitoringApi.createAlert(alert)
            .then(response => {
                const created = AlertAssembler.toEntityFromResource(response.data);
                alerts.value.push(created);
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

    function fetchPlans() {
        monitoringApi.getPlans()
            .then(response => {
                plans.value = Array.isArray(response.data) ? response.data : [];
                plansLoaded.value = true;
            })
            .catch(error => errors.value.push(error));
    }

    /**
     * Actualiza la suscripción activa en la API y en el estado local.
     * @param {Object} updated - Objeto subscription actualizado
     */
    function updateSubscription(updated) {
        // MockAPI returns id as part of the object; fall back to "1" if missing
        const id = subscription.value?.id ?? '1';
        monitoringApi.updateSubscription(id, updated)
            .then(() => {
                subscription.value = { ...updated, id };
            })
            .catch(() => {
                // Even if API call fails, update local state so UI reflects change
                subscription.value = { ...updated, id };
            });
    }


    /**
     * Elimina un sensor de la API y lo quita del estado local.
     */
    function deleteSensor(id) {
        monitoringApi.deleteSensor(id)
            .then(() => {
                sensors.value = sensors.value.filter(s => String(s.id) !== String(id));
            })
            .catch(error => errors.value.push(error));
    }


    /**
     * Marca como resuelta la alerta activa de un sensor (por sensorName).
     */
    function resolveAlertBySensorName(sensorName) {
        const active = alerts.value.find(
            a => a.sensorName === sensorName && a.status === 'Activa'
        );
        if (!active) return;
        const resolved = { ...active, status: 'Resuelta' };
        monitoringApi.updateAlert(resolved)
            .then(() => {
                const idx = alerts.value.findIndex(a => a.id === active.id);
                if (idx !== -1) alerts.value[idx] = { ...alerts.value[idx], status: 'Resuelta' };
            })
            .catch(error => errors.value.push(error));
    }

    /**
     * Elimina todas las alertas activas de un sensor (por sensorName).
     */
    function deleteAlertsBySensorName(sensorName) {
        const toDelete = alerts.value.filter(a => a.sensorName === sensorName);
        toDelete.forEach(alert => {
            monitoringApi.deleteAlert(alert.id)
                .then(() => {
                    alerts.value = alerts.value.filter(a => a.id !== alert.id);
                })
                .catch(error => errors.value.push(error));
        });
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