/**
 * WaterBatch entity within the Service Design and Planning bounded context.
 *
 * Mirrors the backend aggregate `WaterBatch` (api/v1/water-batches) but keeps the
 * shape the UI works with. Backend serializes in camelCase, so the field names here
 * match what the API returns; the assembler is still responsible for any translation
 * (e.g. localized Status / Source labels).
 *
 * @class WaterBatch
 */
export class WaterBatch {
    /**
     * @param {Object}          params
     * @param {?number}         [params.id=null]
     * @param {string}          [params.certificationCode='']
     * @param {?number}         [params.destinationSectorId=null]
     * @param {number}          [params.volumeLiters=0]
     * @param {string}          [params.deliveryTimestamp='']   - ISO string
     * @param {string}          [params.status='Pending']       - 'Pending' | 'Delivered' | 'Cancelled'
     * @param {string}          [params.source='']
     */
    constructor({
                    id = null,
                    certificationCode = '',
                    destinationSectorId = null,
                    volumeLiters = 0,
                    deliveryTimestamp = '',
                    status = 'Pending',
                    source = '',
                } = {}) {
        this.id                  = id;
        this.certificationCode   = certificationCode;
        this.destinationSectorId = destinationSectorId;
        this.volumeLiters        = volumeLiters;
        this.deliveryTimestamp   = deliveryTimestamp;
        this.status              = status;
        this.source              = source;
    }

    /** True when the batch can still transition (not delivered nor cancelled). */
    get isPending() {
        return this.status === 'Pending';
    }
}
