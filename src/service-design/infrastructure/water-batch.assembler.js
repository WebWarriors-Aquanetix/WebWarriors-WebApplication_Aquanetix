import { WaterBatch } from '../domain/model/water-batch.entity.js';

/**
 * Status translation between the backend (English domain strings) and the
 * Spanish labels the UI shows. Backend domain comment documents the canonical
 * values: Pending | Delivered | Cancelled.
 */
const STATUS_BE_TO_UI = { Pending: 'Pendiente', Delivered: 'Entregado', Cancelled: 'Cancelado' };
const STATUS_UI_TO_BE = { Pendiente: 'Pending', Entregado: 'Delivered', Cancelado: 'Cancelled' };

export function batchStatusToUi(s)      { return STATUS_BE_TO_UI[s] ?? s ?? 'Pendiente'; }
export function batchStatusToBackend(s) { return STATUS_UI_TO_BE[s] ?? s ?? 'Pending'; }

/**
 * Source is a free string in the backend. We keep it as-is, but expose the
 * known catalog so forms can offer a dropdown instead of free text.
 */
export const KNOWN_SOURCES = ['Well', 'River', 'Reservoir', 'Desalination', 'Recycled'];

/**
 * Maps WaterBatch resources from the backend into WaterBatch domain entities
 * used by the UI, and back.
 *
 * @class WaterBatchAssembler
 */
export class WaterBatchAssembler {
    /** Backend resource (camelCase) -> UI entity. */
    static toEntityFromResource(resource) {
        return new WaterBatch({
            id:                  resource.id ?? null,
            certificationCode:   resource.certificationCode ?? '',
            destinationSectorId: resource.destinationSectorId ?? null,
            volumeLiters:        resource.volumeLiters ?? 0,
            deliveryTimestamp:   resource.deliveryTimestamp ?? '',
            status:              batchStatusToUi(resource.status),
            source:              resource.source ?? '',
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status} - ${response.statusText}`);
            return [];
        }
        const resources = response.data instanceof Array
            ? response.data
            : (response.data?.waterBatches ?? []);
        return resources.map(resource => this.toEntityFromResource(resource));
    }

    /**
     * UI entity / form -> CreateWaterBatchResource (POST /water-batches).
     * Mirrors the backend record exactly:
     * { certificationCode, destinationSectorId, volumeLiters, deliveryTimestamp, status, source }
     */
    static toCreateResource(batch) {
        return {
            certificationCode:   batch.certificationCode ?? '',
            destinationSectorId: Number(batch.destinationSectorId) || 0,
            volumeLiters:        Number(batch.volumeLiters) || 0,
            deliveryTimestamp:   batch.deliveryTimestamp || new Date().toISOString(),
            status:              batchStatusToBackend(batch.status),
            source:              batch.source ?? '',
        };
    }

    /**
     * UI entity / form -> UpdateWaterBatchResource (PUT /water-batches/{id}).
     * Same shape as create (the backend Update command carries all fields).
     */
    static toUpdateResource(batch) {
        return this.toCreateResource(batch);
    }
}
