import { Destination } from '../domain/model/destination.entity.js';

export class DestinationAssembler {
    static toEntityFromResource(resource) {
        return new Destination({
            id:          resource.id ?? null,
            name:        resource.name ?? '',
            address:     resource.address ?? '',
            description: resource.description ?? '',
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array
            ? response.data
            : (response.data?.destinations ?? []);
        return resources.map(r => this.toEntityFromResource(r));
    }

    static toCreateResource(destination) {
        return {
            name:        destination.name ?? '',
            address:     destination.address ?? '',
            description: destination.description ?? '',
        };
    }
}
