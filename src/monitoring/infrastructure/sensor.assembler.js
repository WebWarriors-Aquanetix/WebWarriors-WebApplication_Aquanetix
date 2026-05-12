import { Sensor } from '../domain/model/sensor.entity.js';

/**
 * Maps sensor resources from the API into Sensor domain entities.
 *
 * @class SensorAssembler
 */
export class SensorAssembler {
    static toEntityFromResource(resource) {
        return new Sensor({
            ...resource,
            id: resource.id,   // Keep as string - MockAPI always returns string IDs
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array ? response.data : response.data['sensors'];
        return resources.map(resource => this.toEntityFromResource(resource));
    }
}