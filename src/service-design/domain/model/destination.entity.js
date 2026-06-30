/**
 * Destination entity within the Service Design bounded context.
 * Mirrors the backend aggregate `Destination` (api/v1/destinations).
 * Backend serializes camelCase, so field names match the API response.
 */
export class Destination {
    constructor({ id = null, name = '', address = '', description = '' } = {}) {
        this.id          = id;
        this.name        = name;
        this.address     = address;
        this.description = description;
    }
}
