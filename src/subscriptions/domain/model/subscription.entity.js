/**
 * Subscription entity. Mirrors the backend aggregate:
 * { id, userId, plan, status }. No invented fields.
 */
export class Subscription {
    constructor({ id = null, userId = null, plan = '', status = '' } = {}) {
        this.id     = id;
        this.userId = userId;
        this.plan   = plan;
        this.status = status;
    }

    get isActive()    { return this.status === 'Active'; }
    get isCancelled() { return this.status === 'Cancelled'; }
}
