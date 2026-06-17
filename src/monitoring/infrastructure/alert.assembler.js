import { Alert } from '../domain/model/alert.entity.js';

// AlertLevel backend (Warning|Critical) → severity UI (Advertencia|Crítica)
const SEVERITY_BE_TO_UI = { Critical: 'Crítica', Warning: 'Advertencia' };
const SEVERITY_UI_TO_BE = { 'Crítica': 'Critical', 'Advertencia': 'Warning' };

// status: el backend guarda string libre; normalizamos a las etiquetas de la UI
const STATUS_BE_TO_UI = { Active: 'Activa', Resolved: 'Resuelta', Activa: 'Activa', Resuelta: 'Resuelta' };
const STATUS_UI_TO_BE = { 'Activa': 'Active', 'Resuelta': 'Resolved' };

export function severityToUi(s)      { return SEVERITY_BE_TO_UI[s] ?? s ?? 'Advertencia'; }
export function severityToBackend(s) { return SEVERITY_UI_TO_BE[s] ?? s ?? 'Warning'; }
export function alertStatusToUi(s)   { return STATUS_BE_TO_UI[s] ?? s ?? 'Activa'; }
export function alertStatusToBackend(s) { return STATUS_UI_TO_BE[s] ?? s ?? 'Active'; }

/**
 * Maps Alert resources from the real backend into Alert domain entities used by the UI.
 * Backend usa deviceId/deviceName; la UI usa sensorId/sensorName.
 * @class AlertAssembler
 */
export class AlertAssembler {
    static toEntityFromResource(resource) {
        return new Alert({
            id:         resource.id ?? null,
            sensorId:   resource.deviceId ?? null,
            sensorName: resource.deviceName ?? '',
            location:   resource.location ?? '',
            type:       resource.type ?? '',
            severity:   severityToUi(resource.severity),
            message:    resource.message ?? '',
            timestamp:  resource.timestamp ?? '',
            status:     alertStatusToUi(resource.status),
            value:      resource.value ?? 0,
            threshold:  resource.threshold ?? 0,
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : (response.data?.alerts ?? []);
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Alert (UI) → Create/UpdateAlertResource (backend).
     */
    static toResource(alert) {
        return {
            id:         alert.id ?? undefined,
            deviceId:   Number(alert.sensorId) || 0,
            deviceName: alert.sensorName ?? '',
            location:   alert.location ?? '',
            type:       alert.type ?? '',
            severity:   severityToBackend(alert.severity),
            message:    alert.message ?? '',
            timestamp:  alert.timestamp || new Date().toISOString(),
            status:     alertStatusToBackend(alert.status),
            value:      Number(alert.value) || 0,
            threshold:  Number(alert.threshold) || 0,
        };
    }
}
