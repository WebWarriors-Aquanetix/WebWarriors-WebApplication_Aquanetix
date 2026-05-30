<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import useMonitoringStore from '../../application/monitoring.store.js';
import { onMounted, toRefs } from 'vue';

const { t } = useI18n();
const router = useRouter();
const store = useMonitoringStore();
const { subscription, subscriptionLoaded } = toRefs(store);
const { fetchSubscription } = store;

onMounted(() => {
  if (!store.subscriptionLoaded) fetchSubscription();
});

const usagePercent = (used, limit) => Math.round((used / limit) * 100);
</script>

<template>
  <div class="p-4">
    <div class="mb-4">
      <h1 class="text-3xl font-bold m-0" style="font-family: 'Manrope', sans-serif;">{{ t('subscription.title') }}</h1>
      <p class="text-color-secondary mt-1">{{ t('subscription.subtitle') }}</p>
    </div>

    <div v-if="!subscriptionLoaded" class="flex justify-content-center py-6">
      <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
    </div>

    <template v-else-if="subscription">
      <div class="grid">

        <!-- Plan card -->
        <div class="col-12 lg:col-5">
          <pv-card class="mb-3" style="border-top: 4px solid #007BFF;">
            <template #content>
              <pv-tag value="Plan actual" severity="info" class="mb-3" />
              <div class="flex align-items-center gap-3 mb-3">
                <i class="pi pi-crown" style="color: #007BFF; font-size: 2rem;"></i>
                <div>
                  <h2 class="m-0 text-xl">{{ subscription.plan }}</h2>
                  <p class="text-color-secondary text-sm m-0">{{ subscription.tier }}</p>
                </div>
              </div>
              <p class="m-0 mb-3" style="font-size: 2.2rem; font-weight: 700; color: #007BFF;">
                S/ {{ subscription.price.toFixed(2) }}
                <span style="font-size: 1rem; font-weight: 400; color: #64748b;">/ {{ t('subscription.monthly') }}</span>
              </p>
              <ul class="list-none p-0 m-0 flex flex-column gap-2 mb-4">
                <li v-for="feature in subscription.features" :key="feature" class="flex align-items-center gap-2 text-sm">
                  <i class="pi pi-check" style="color: #10B981;"></i>
                  {{ feature }}
                </li>
              </ul>
              <div class="flex gap-2">
                <pv-button :label="t('subscription.changePlan')" icon="pi pi-refresh" outlined size="small" @click="router.push({ name: 'monitoring-change-plan' })" />
                <pv-button :label="t('subscription.cancelSubscription')" severity="danger" text size="small" />
              </div>
            </template>
          </pv-card>
        </div>

        <!-- Usage + billing -->
        <div class="col-12 lg:col-7 flex flex-column gap-3">

          <pv-card>
            <template #title>{{ t('subscription.planUsage') }}</template>
            <template #content>
              <!-- Sensors -->
              <div class="mb-3">
                <div class="flex justify-content-between mb-1">
                  <span class="text-sm">{{ t('subscription.sensorsConnected') }}</span>
                  <span class="text-sm font-bold">{{ subscription.usage.sensorsConnected }} / {{ subscription.usage.sensorsLimit }}</span>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                  <div :style="{ width: usagePercent(subscription.usage.sensorsConnected, subscription.usage.sensorsLimit) + '%', height: '100%', background: '#007BFF', borderRadius: '4px' }"></div>
                </div>
              </div>
              <!-- Storage -->
              <div class="mb-3">
                <div class="flex justify-content-between mb-1">
                  <span class="text-sm">{{ t('subscription.dataStorage') }}</span>
                  <span class="text-sm font-bold">{{ subscription.usage.storageUsedGB }} GB / {{ subscription.usage.storageLimitGB }} GB</span>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                  <div :style="{ width: usagePercent(subscription.usage.storageUsedGB, subscription.usage.storageLimitGB) + '%', height: '100%', background: '#10B981', borderRadius: '4px' }"></div>
                </div>
              </div>
              <!-- Exports -->
              <div>
                <div class="flex justify-content-between mb-1">
                  <span class="text-sm">{{ t('subscription.dataExports') }}</span>
                  <span class="text-sm font-bold">{{ subscription.usage.exports }} / {{ subscription.usage.exportsLimit }}</span>
                </div>
                <div style="height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                  <div :style="{ width: usagePercent(subscription.usage.exports, subscription.usage.exportsLimit) + '%', height: '100%', background: '#f59e0b', borderRadius: '4px' }"></div>
                </div>
              </div>
            </template>
          </pv-card>

          <pv-card>
            <template #title>{{ t('subscription.billingInfo') }}</template>
            <template #content>
              <!-- Grid de 2 columnas con style inline -->
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px 8px;">
                <span class="text-sm text-color-secondary">{{ t('subscription.paymentMethod') }}</span>
                <span class="text-sm font-medium">{{ subscription.paymentMethod }}</span>

                <span class="text-sm text-color-secondary">{{ t('subscription.startDate') }}</span>
                <span class="text-sm font-medium">{{ subscription.startDate }}</span>

                <span class="text-sm text-color-secondary">{{ t('subscription.nextBilling') }}</span>
                <span class="text-sm font-medium">{{ subscription.nextBillingDate }}</span>

                <span class="text-sm text-color-secondary">{{ t('subscription.amount') }}</span>
                <span class="text-sm font-medium">S/ {{ subscription.price.toFixed(2) }}</span>

                <span class="text-sm text-color-secondary">{{ t('subscription.billingCycle') }}</span>
                <span class="text-sm font-medium">{{ t('subscription.monthly_label') }}</span>
              </div>
            </template>
          </pv-card>

          <pv-card>
            <template #content>
              <div class="flex align-items-start gap-3">
                <i class="pi pi-headphones" style="color: #10B981; font-size: 1.4rem;"></i>
                <div>
                  <p class="font-bold m-0">{{ t('subscription.needHelp') }}</p>
                  <p class="text-sm text-color-secondary mt-1 mb-2">{{ t('subscription.helpText') }}</p>
                  <pv-button :label="t('subscription.contactSupport')" icon="pi pi-envelope" outlined size="small" />
                </div>
              </div>
            </template>
          </pv-card>

        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
</style>