<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { onMounted, computed, ref, toRefs } from 'vue';
import useSubscriptionStore from '../../application/subscription.store.js';
import { featuresForPlan } from '../../domain/model/plan-features.catalog.js';

const { t } = useI18n();
const router = useRouter();
const store = useSubscriptionStore();

const { subscription, plans, subscriptionLoaded } = toRefs(store);
const { fetchSubscription, fetchPlans, cancelSubscription, renewSubscription } = store;

onMounted(() => {
  fetchSubscription(); // always refetch: user may have changed
  if (!store.plansLoaded)        fetchPlans();
});

// Cross the current subscription's plan name with the real catalog to get price/limit.
const currentPlan = computed(() =>
  plans.value.find(p => p.name === subscription.value?.plan) ?? null);

const features = computed(() => featuresForPlan(subscription.value?.plan));

const busy = ref(false);
const doCancel = async () => { busy.value = true; try { await cancelSubscription(); } finally { busy.value = false; } };
const doRenew  = async () => { busy.value = true; try { await renewSubscription();  } finally { busy.value = false; } };

const statusSeverity = computed(() =>
  subscription.value?.status === 'Active' ? 'success'
  : subscription.value?.status === 'Cancelled' ? 'danger' : 'info');
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

    <!-- No subscription yet -->
    <template v-else-if="!subscription">
      <pv-card>
        <template #content>
          <div class="text-center py-4">
            <i class="pi pi-inbox" style="font-size:2.5rem;color:#94a3b8;"></i>
            <p class="mt-3 mb-1 font-medium">{{ t('subscription.noneTitle') }}</p>
            <p class="text-color-secondary text-sm">{{ t('subscription.noneSubtitle') }}</p>
          </div>
        </template>
      </pv-card>
    </template>

    <!-- Active subscription -->
    <template v-else>
      <div class="grid">
        <div class="col-12 lg:col-6">
          <pv-card style="border-top: 4px solid #007BFF;">
            <template #content>
              <div class="flex align-items-center justify-content-between mb-3">
                <pv-tag :value="t('subscription.currentPlanTag')" severity="info" />
                <pv-tag :value="subscription.status" :severity="statusSeverity" />
              </div>

              <div class="flex align-items-center gap-3 mb-3">
                <i class="pi pi-crown" style="color: #007BFF; font-size: 2rem;"></i>
                <h2 class="m-0 text-2xl">{{ subscription.plan }}</h2>
              </div>

              <p v-if="currentPlan" class="m-0 mb-3" style="font-size: 2.2rem; font-weight: 700; color: #007BFF;">
                S/ {{ currentPlan.monthlyCost.toLocaleString('es-PE') }}
                <span style="font-size: 1rem; font-weight: 400; color: #64748b;">/ {{ t('subscription.monthly') }}</span>
              </p>

              <div v-if="currentPlan" class="mb-3 p-2" style="background:#f8fafc;border-radius:8px;">
                <i class="pi pi-database mr-1" style="color:#007BFF;"></i>
                <span class="text-sm font-medium">
                  {{ currentPlan.isUnlimited ? t('subscription.unlimitedDevices') : t('subscription.upToDevices', { n: currentPlan.maxDevices }) }}
                </span>
              </div>

              <ul class="list-none p-0 m-0 flex flex-column gap-2 mb-4">
                <li v-for="feature in features" :key="feature" class="flex align-items-center gap-2 text-sm">
                  <i class="pi pi-check" style="color: #10B981;"></i>{{ feature }}
                </li>
              </ul>

              <div class="flex gap-2 flex-wrap">
                <pv-button :label="t('subscription.changePlan')" icon="pi pi-refresh" outlined size="small"
                           @click="router.push({ name: 'subscription-change-plan' })" />
                <pv-button v-if="subscription.status !== 'Cancelled'"
                           :label="t('subscription.cancelSubscription')" severity="danger" text size="small"
                           :loading="busy" @click="doCancel" />
                <pv-button v-else
                           :label="t('subscription.renewSubscription')" severity="success" text size="small"
                           :loading="busy" @click="doRenew" />
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
