<script setup>
import { ref, onMounted }           from 'vue';
import { useI18n }                  from 'vue-i18n';
import { useServiceDesignStore }    from '../../application/service-design.store.js';

const { t }    = useI18n();
const store    = useServiceDesignStore();

const showDialog = ref(false);
const newSector  = ref('');

onMounted(() => store.fetchAll());

async function handleCreate() {
  if (!newSector.value.trim()) return;
  await store.createPlan(newSector.value.trim());
  newSector.value  = '';
  showDialog.value = false;
}

const statusSeverity = (status) =>
  ({ pending: 'warn', certified: 'info', distributed: 'success' }[status] ?? 'secondary');
</script>

<template>
  <div class="p-4">
    <!-- Header -->
    <div class="flex align-items-center justify-content-between mb-4">
      <h2 class="m-0">{{ t('option.services') }}</h2>
      <pv-button
        :label="t('services.newBatch')"
        icon="pi pi-plus"
        @click="showDialog = true"
      />
    </div>

    <!-- Loading -->
    <div v-if="store.loading" class="flex justify-content-center py-6">
      <pv-progress-bar/>
    </div>

    <!-- Empty state -->
    <pv-message
      v-else-if="!store.plans.length"
      severity="info"
      :closable="false"
    >
      {{ t('services.noBatches') }}
    </pv-message>

    <!-- Plan cards -->
    <div v-else class="grid">
      <div
        v-for="plan in store.plans"
        :key="plan.id"
        class="col-12 md:col-6 lg:col-4"
      >
        <pv-card>
          <template #title>
            <div class="flex align-items-center justify-content-between">
              <span>{{ plan.sector }}</span>
              <pv-tag :severity="statusSeverity(plan.status)" :value="plan.status" />
            </div>
          </template>

          <template #content>
            <ul class="list-none p-0 m-0 flex flex-column gap-2">
              <li class="flex align-items-center gap-2">
                <i :class="plan.waterQualityApproved
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-gray-400'" />
                <span class="text-sm">{{ t('services.waterQuality') }}</span>
              </li>
              <li class="flex align-items-center gap-2">
                <i :class="plan.regulatoryComplianceValidated
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-gray-400'" />
                <span class="text-sm">{{ t('services.regulatoryCompliance') }}</span>
              </li>
              <li class="flex align-items-center gap-2">
                <i :class="plan.transportRoute
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-gray-400'" />
                <span class="text-sm">
                  {{ t('services.transportRoute') }}: {{ plan.transportRoute ?? '—' }}
                </span>
              </li>
              <li class="flex align-items-center gap-2">
                <i :class="plan.redistributionScheduled
                  ? 'pi pi-check-circle text-green-500'
                  : 'pi pi-circle text-gray-400'" />
                <span class="text-sm">{{ t('services.redistributionScheduled') }}</span>
              </li>
            </ul>
          </template>

          <template #footer>
            <div class="flex flex-wrap gap-2">
              <pv-button
                v-if="!plan.waterQualityApproved"
                size="small"
                :label="t('services.certifyQuality')"
                icon="pi pi-verified"
                @click="store.certifyWaterQuality(plan.id)"
              />
              <pv-button
                v-if="!plan.regulatoryComplianceValidated"
                size="small"
                :label="t('services.validateCompliance')"
                icon="pi pi-shield"
                severity="info"
                @click="store.validateRegulatoryCompliance(plan.id)"
              />
              <pv-button
                v-if="!plan.transportRoute"
                size="small"
                :label="t('services.optimizeRoute')"
                icon="pi pi-map"
                severity="secondary"
                @click="store.optimizeLogisticsRoute(plan.id)"
              />
              <pv-button
                v-if="plan.transportRoute && !plan.redistributionScheduled"
                size="small"
                :label="t('services.schedule')"
                icon="pi pi-calendar"
                severity="success"
                @click="store.scheduleRedistribution(plan.id)"
              />
              <pv-button
                size="small"
                :label="t('option.delete')"
                icon="pi pi-trash"
                severity="danger"
                outlined
                @click="store.deletePlan(plan.id)"
              />
            </div>
          </template>
        </pv-card>
      </div>
    </div>

    <!-- Create dialog -->
    <pv-dialog
      v-model:visible="showDialog"
      :header="t('services.newPlan')"
      :style="{ width: '380px' }"
      modal
    >
      <div class="flex flex-column gap-3 pt-2">
        <label for="sector">{{ t('services.sector') }}</label>
        <pv-input-text
          id="sector"
          v-model="newSector"
          :placeholder="t('services.sectorPlaceholder')"
          autofocus
        />
      </div>
      <template #footer>
        <pv-button
          :label="t('option.cancel')"
          severity="secondary"
          text
          @click="showDialog = false"
        />
        <pv-button
          :label="t('option.create')"
          :disabled="!newSector.trim()"
          @click="handleCreate"
        />
      </template>
    </pv-dialog>
  </div>
</template>
