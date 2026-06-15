import { defineStore } from 'pinia';
import { ref }         from 'vue';
import { ServiceDesignApiService } from '../infrastructure/service-design-api.service.js';

const api = new ServiceDesignApiService();

export const useServiceDesignStore = defineStore('service-design', () => {
  // ── State ──────────────────────────────────────────────────────────────────
  const plans   = ref([]);
  const loading = ref(false);
  const error   = ref(null);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function fetchAll() {
    loading.value = true;
    error.value   = null;
    try {
      plans.value = await api.getAll();
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function createPlan(sector) {
    loading.value = true;
    error.value   = null;
    try {
      const plan  = await api.create({ sector, status: 'pending' });
      plans.value.push(plan);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  async function certifyWaterQuality(id) {
    await _patch(id, { waterQualityApproved: true });
  }

  async function validateRegulatoryCompliance(id) {
    await _patch(id, { regulatoryComplianceValidated: true });
  }

  async function optimizeLogisticsRoute(id) {
    const plan  = plans.value.find(p => p.id === id);
    const route = `ROUTE-${plan?.sector?.toUpperCase() ?? id}-OPT`;
    await _patch(id, { transportRoute: route });
  }

  async function scheduleRedistribution(id) {
    await _patch(id, { redistributionScheduled: true, status: 'distributed' });
  }

  async function deletePlan(id) {
    loading.value = true;
    error.value   = null;
    try {
      await api.delete(id);
      plans.value = plans.value.filter(p => p.id !== id);
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  async function _patch(id, fields) {
    loading.value = true;
    error.value   = null;
    try {
      const current = plans.value.find(p => p.id === id);
      const updated = await api.update(id, { ...current, ...fields });
      const idx     = plans.value.findIndex(p => p.id === id);
      if (idx !== -1) plans.value[idx] = updated;
    } catch (e) {
      error.value = e.message;
    } finally {
      loading.value = false;
    }
  }

  return {
    plans,
    loading,
    error,
    fetchAll,
    createPlan,
    certifyWaterQuality,
    validateRegulatoryCompliance,
    optimizeLogisticsRoute,
    scheduleRedistribution,
    deletePlan,
  };
});
