import axios from 'axios';
import { WaterBatchAssembler } from './water-batch.assembler.js';

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/water-batches`;

export class ServiceDesignApiService {
  /** @returns {Promise<WaterBatch[]>} */
  async getAll() {
    const response = await axios.get(BASE_URL);
    return response.data.map(WaterBatchAssembler.toEntityFromResource);
  }

  /** @param {string} id @returns {Promise<WaterBatch>} */
  async getById(id) {
    const response = await axios.get(`${BASE_URL}/${id}`);
    return WaterBatchAssembler.toEntityFromResource(response.data);
  }

  /** @param {Object} payload @returns {Promise<WaterBatch>} */
  async create(payload) {
    const response = await axios.post(BASE_URL, payload);
    return WaterBatchAssembler.toEntityFromResource(response.data);
  }

  /** @param {string} id @param {Object} payload @returns {Promise<WaterBatch>} */
  async update(id, payload) {
    const response = await axios.put(`${BASE_URL}/${id}`, payload);
    return WaterBatchAssembler.toEntityFromResource(response.data);
  }

  /** @param {string} id @returns {Promise<void>} */
  async delete(id) {
    await axios.delete(`${BASE_URL}/${id}`);
  }
}
