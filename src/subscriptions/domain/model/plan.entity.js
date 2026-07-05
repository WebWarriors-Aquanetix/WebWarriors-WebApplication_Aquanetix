/**
 * Plan entity from the backend catalog (GET /subscriptions/plans).
 * Backend fields: name, monthlyCost, maxDevices, isUnlimited (maxDevices -1 = unlimited).
 */
export class Plan {
    constructor({ name = '', monthlyCost = 0, maxDevices = 0, isUnlimited = false } = {}) {
        this.name        = name;
        this.monthlyCost = monthlyCost;
        this.maxDevices  = maxDevices;
        this.isUnlimited = isUnlimited;
    }

    /** Human-readable device limit for display. */
    get deviceLimitLabel() {
        return this.isUnlimited ? '∞' : String(this.maxDevices);
    }
}
