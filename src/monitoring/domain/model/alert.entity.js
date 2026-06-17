/**
 * Alert entity within the Monitoring bounded context.
 *
 * @class Alert
 */
export class Alert {
    /**
     * @param {Object} params - Entity attributes.
     * @param {?number} [params.id=null]
     * @param {number} [params.sensorId=null]
     * @param {string} [params.sensorName='']
     * @param {string} [params.location='']
     * @param {string} [params.type='']
     * @param {string} [params.severity=''] - 'Crítica' | 'Advertencia'
     * @param {string} [params.message='']
     * @param {string} [params.timestamp='']
     * @param {string} [params.status=''] - 'Activa' | 'Resuelta'
     * @param {number} [params.value=0]
     * @param {number} [params.threshold=0]
     */
    constructor({
                    id = null,
                    sensorId = null,
                    sensorName = '',
                    location = '',
                    type = '',
                    severity = '',
                    message = '',
                    timestamp = '',
                    status = '',
                    value = 0,
                    threshold = 0
                }) {
        this.id = id;
        this.sensorId = sensorId;
        this.sensorName = sensorName;
        this.location = location;
        this.type = type;
        this.severity = severity;
        this.message = message;
        this.timestamp = timestamp;
        this.status = status;
        this.value = value;
        this.threshold = threshold;
    }
}
