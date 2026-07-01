import { Sensor } from '../domain/model/sensor.entity.js';

// ── Mapas de traducción entre enums del backend y etiquetas de la UI ──────

// DeviceType (backend, string) → tipo en español que usa la UI
const TYPE_BE_TO_UI = {
    PH: 'pH', Turbidity: 'Turbidez', Pressure: 'Presión',
    Level: 'Nivel', Chlorine: 'Cloro', Flow: 'Flujo',
    DissolvedOxygen: 'Oxígeno disuelto', Temperature: 'Temperatura',
};
const TYPE_UI_TO_BE = {
    'pH': 'PH', 'Turbidez': 'Turbidity', 'Presión': 'Pressure',
    'Nivel': 'Level', 'Cloro': 'Chlorine', 'Flujo': 'Flow',
    'Oxígeno disuelto': 'DissolvedOxygen', 'Temperatura': 'Temperature',
};

// DeviceStatus (backend) → estado en español que usa la UI
const STATUS_BE_TO_UI = {
    Normal: 'Normal', Warning: 'Advertencia', Alert: 'Alerta', Offline: 'Offline',
};
const STATUS_UI_TO_BE = {
    'Normal': 'Normal', 'Advertencia': 'Warning', 'Alerta': 'Alert', 'Offline': 'Offline',
};

export function deviceTypeToUi(t)   { return TYPE_BE_TO_UI[t]   ?? t ?? ''; }
export function deviceTypeToBackend(t) { return TYPE_UI_TO_BE[t] ?? t ?? 'PH'; }
export function statusToUi(s)       { return STATUS_BE_TO_UI[s] ?? s ?? 'Normal'; }
export function statusToBackend(s)  { return STATUS_UI_TO_BE[s] ?? s ?? 'Normal'; }

/**
 * Calcula el estado de un sensor comparando su valor contra los umbrales.
 * - Fuera del rango (< min o > max)   → 'Alerta'
 * - Cerca del límite (margen del 10%) → 'Advertencia'
 * - Dentro del rango                  → 'Normal'
 */
export function computeStatus(value, min, max) {
    const v = Number(value);
    const lo = Number(min);
    const hi = Number(max);
    if (Number.isNaN(v) || (lo === 0 && hi === 0)) return 'Normal';
    if (v < lo || v > hi) return 'Alerta';
    const margin = (hi - lo) * 0.1;
    if (v <= lo + margin || v >= hi - margin) return 'Advertencia';
    return 'Normal';
}

/**
 * Genera un history sintético de 7 puntos alrededor del valor actual.
 * (La telemetría histórica real es trabajo futuro en el backend.)
 */
function synthHistory(currentValue) {
    const base = Number(currentValue) || 0;
    if (base === 0) return [0, 0, 0, 0, 0, 0, 0];
    const v = base * 0.06;
    return Array.from({ length: 7 }, (_, i) =>
        i === 6 ? parseFloat(base.toFixed(2))
                : parseFloat((base + (Math.random() * v * 2 - v)).toFixed(2)));
}

/**
 * Maps a Device resource from the real backend into the Sensor shape the UI expects.
 * @class SensorAssembler
 */
export class SensorAssembler {
    static toEntityFromResource(resource) {
        const type   = deviceTypeToUi(resource.deviceType);
        const status = statusToUi(resource.currentStatus);
        const cv     = resource.currentValue ?? 0;

        return new Sensor({
            id:               resource.id,
            // Si el backend trae name/location vacíos, caemos al serialNumber como etiqueta
            name:             resource.name && resource.name.length ? resource.name : (resource.serialNumber ?? `Device ${resource.id}`),
            location:         resource.location ?? '',
            destinationId:    resource.destinationId ?? null,
            type,
            currentValue:     cv,
            unit:             resource.unit ?? '',
            status,
            lastUpdated:      resource.lastTelemetrySync ?? '',
            recommendedRange: '',          // se completa al traer thresholds
            minAlert:         0,            // idem
            maxAlert:         0,            // idem
            history:          synthHistory(cv),
            // metadatos del backend que conviene conservar
            ownerId:          resource.ownerId ?? 0,
            serialNumber:     resource.serialNumber ?? '',
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : (response.data?.devices ?? []);
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * Aplica los thresholds (de GET /devices/{id}/thresholds) sobre un Sensor ya mapeado.
     * Toma el primer threshold disponible (el modelo de UI solo soporta uno) y
     * recalcula el status real comparando currentValue vs umbrales (Camino A:
     * el frontend es el cerebro del cálculo de estado).
     */
    static applyThresholds(sensor, thresholds) {
        if (!Array.isArray(thresholds) || thresholds.length === 0) return sensor;
        const t = thresholds[0];
        sensor.minAlert         = t.minValue ?? 0;
        sensor.maxAlert         = t.maxValue ?? 0;
        sensor.unit             = sensor.unit || (t.unit ?? '');
        sensor.recommendedRange = `${sensor.minAlert} - ${sensor.maxAlert}`;
        // Recalcular status solo si hay umbrales válidos y el device no está Offline
        if (sensor.status !== 'Offline' && (sensor.minAlert || sensor.maxAlert)) {
            sensor.status = computeStatus(sensor.currentValue, sensor.minAlert, sensor.maxAlert);
        }
        return sensor;
    }

    /**
     * Sensor (UI) → CreateDeviceResource (backend) para POST /devices.
     */
    static toCreateResource(sensor) {
        return {
            ownerId:      sensor.ownerId || 1,
            serialNumber: sensor.serialNumber || sensor.name || `SN-${Date.now()}`,
            deviceType:   deviceTypeToBackend(sensor.type),
            name:         sensor.name ?? '',
            location:     sensor.location ?? '',
            destinationId: sensor.destinationId ?? null,
            unit:         sensor.unit ?? '',
            currentValue: Number(sensor.currentValue) || 0,
        };
    }

    /**
     * Sensor (UI) → UpdateDeviceResource (backend) para PUT /devices/{id}.
     */
    static toUpdateResource(sensor) {
        return {
            currentStatus:     statusToBackend(sensor.status),
            lastTelemetrySync: new Date().toISOString(),
            name:              sensor.name ?? '',
            location:          sensor.location ?? '',
            destinationId:     sensor.destinationId ?? null,
            unit:              sensor.unit ?? '',
            currentValue:      Number(sensor.currentValue) || 0,
        };
    }
}
