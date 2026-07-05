import { Subscription } from '../domain/model/subscription.entity.js';
import { Plan } from '../domain/model/plan.entity.js';

export class SubscriptionAssembler {
    static toEntityFromResource(resource) {
        return new Subscription({
            id:     resource.id ?? null,
            userId: resource.userId ?? null,
            plan:   resource.plan ?? '',
            status: resource.status ?? '',
        });
    }

    static toPlanEntity(resource) {
        return new Plan({
            name:        resource.name ?? '',
            monthlyCost: resource.monthlyCost ?? 0,
            maxDevices:  resource.maxDevices ?? 0,
            isUnlimited: resource.isUnlimited ?? false,
        });
    }

    static toPlansFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const list = response.data instanceof Array ? response.data : [];
        return list.map(r => this.toPlanEntity(r));
    }
}
