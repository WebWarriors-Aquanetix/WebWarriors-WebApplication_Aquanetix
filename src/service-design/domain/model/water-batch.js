export class WaterBatch {
  /**
   * @param {number|null}    id
   * @param {string}         certificationCode
   * @param {number}         destinationSectorId
   * @param {number}         volumeLiters
   * @param {string}         deliveryTimestamp - ISO 8601 String (DateTimeOffset)
   * @param {string}         status            - 'Pending' | 'Delivered' | 'Cancelled'
   * @param {string}         source
   * @param {string|null}    createdAt         - ISO 8601 String
   * @param {string|null}    updatedAt         - ISO 8601 String
   */
  constructor(
      id = null,
      certificationCode = '',
      destinationSectorId = 0,
      volumeLiters = 0.0,
      deliveryTimestamp = '',
      status = 'Pending',
      source = '',
      createdAt = null,
      updatedAt = null
  ) {
    this.id                  = id;
    this.certificationCode   = certificationCode;
    this.destinationSectorId = destinationSectorId;
    this.volumeLiters        = volumeLiters;
    this.deliveryTimestamp   = deliveryTimestamp;
    this.status              = status;
    this.source              = source;
    this.createdAt           = createdAt;
    this.updatedAt           = updatedAt;
  }
}