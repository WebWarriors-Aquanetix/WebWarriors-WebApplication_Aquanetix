import { WaterBatch } from '../domain/model/water-batch.js';

export class WaterBatchAssembler {
  /**
   * Maps a raw API response object to a WaterBatch entity.
   * @param {Object} resource
   * @returns {WaterBatch}
   */
  static toEntityFromResource(resource) {
    return new WaterBatch(
      resource.id,
      resource.sector,
      resource.status,
      resource.waterQualityApproved,
      resource.regulatoryComplianceValidated,
      resource.transportRoute,
      resource.redistributionScheduled,
      resource.createdAt,
    );
  }

  /**
   * Maps a WaterBatch entity to the payload expected by the API.
   * @param {WaterBatch} entity
   * @returns {Object}
   */
  static toResourceFromEntity(entity) {
    return {
      id:                            entity.id,
      certificationCode:             entity.certificationCode,
      destinationSectorId:           entity.destinationSectorId,
      volumeLiters:                  entity.volumeLiters,
      deliveryTimestamp:             entity.deliveryTimestamp
    };
  }
}
