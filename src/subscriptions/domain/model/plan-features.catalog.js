/**
 * Marketing feature lists per plan. This is presentation/catalog data that
 * legitimately lives in the frontend (the backend only models name, price and
 * device limit). Keyed by the backend plan name.
 */
export const PLAN_FEATURES = {
    'Basic': [
        'Hasta 10 dispositivos',
        'Monitoreo en tiempo real',
        'Alertas por umbral',
        'Soporte por correo',
    ],
    'Smart City': [
        'Hasta 35 dispositivos',
        'Monitoreo en tiempo real',
        'Alertas por umbral y severidad',
        'Gestión de lotes y destinos',
        'Soporte prioritario',
    ],
    'Industrial': [
        'Dispositivos ilimitados',
        'Monitoreo en tiempo real',
        'Alertas avanzadas',
        'Gestión completa de lotes y destinos',
        'Soporte dedicado 24/7',
    ],
};

/** Which plan to highlight as "most popular" (pure presentation). */
export const HIGHLIGHTED_PLAN = 'Smart City';

export function featuresForPlan(planName) {
    return PLAN_FEATURES[planName] ?? [];
}
