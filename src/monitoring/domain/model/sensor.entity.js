/**
 * Sensor entity within the Monitoring bounded context.
 *
 * @class Sensor
 */
export class Sensor {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null]
     * @param {string} [params.name='']
     * @param {string} [params.location='']
     * @param {string} [params.type='']
     * @param {number} [params.currentValue=0]
     * @param {string} [params.unit='']
     * @param {string} [params.status='Normal'] - 'Normal' | 'Advertencia' | 'Alerta'
     * @param {string} [params.lastUpdated='']
     * @param {string} [params.recommendedRange='']
     * @param {number} [params.minAlert=0]
     * @param {number} [params.maxAlert=0]
     * @param {number[]} [params.history=[]]
     */
    constructor({
                    id = null,
                    name = '',
                    location = '',
                    type = '',
                    currentValue = 0,
                    unit = '',
                    status = 'Normal',
                    lastUpdated = '',
                    recommendedRange = '',
                    minAlert = 0,
                    maxAlert = 0,
                    history = []
                }) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.type = type;
        this.currentValue = currentValue;
        this.unit = unit;
        this.status = status;
        this.lastUpdated = lastUpdated;
        this.recommendedRange = recommendedRange;
        this.minAlert = minAlert;
        this.maxAlert = maxAlert;
        this.history = history;
    }
}
