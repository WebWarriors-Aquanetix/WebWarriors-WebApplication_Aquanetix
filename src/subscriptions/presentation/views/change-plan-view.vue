<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ref, computed, toRefs, onMounted } from 'vue';
import useSubscriptionStore from '../../application/subscription.store.js';
import { featuresForPlan, HIGHLIGHTED_PLAN } from '../../domain/model/plan-features.catalog.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useSubscriptionStore();

const { subscription, plans, plansLoaded } = toRefs(store);
const { fetchPlans, fetchSubscription, changePlan } = store;

onMounted(() => {
  if (!store.plansLoaded)        fetchPlans();
  fetchSubscription();
});

const currentPlanName = computed(() => subscription.value?.plan ?? '');

const selectedPlan = ref(null);
const showConfirm  = ref(false);
const saving       = ref(false);
const errorMsg     = ref('');

const featuresOf   = (plan) => featuresForPlan(plan.name);
const isHighlight  = (plan) => plan.name === HIGHLIGHTED_PLAN;

const choosePlan = (plan) => {
  selectedPlan.value = plan;
  errorMsg.value     = '';
  showConfirm.value  = true;
};

const confirmChange = async () => {
  if (!selectedPlan.value) return;
  saving.value = true;
  errorMsg.value = '';
  try {
    await changePlan(selectedPlan.value.name);   // real PUT /subscriptions/{id}/plan
    showConfirm.value = false;
    router.push({ name: 'subscription-detail' });
  } catch (_) {
    errorMsg.value = t('subscription.changeError');
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <div class="p-4">
    <div class="flex align-items-center gap-3 mb-2">
      <pv-button icon="pi pi-arrow-left" text @click="router.push({ name: 'subscription-detail' })" />
      <div>
        <h1 class="text-3xl font-bold m-0" style="font-family:'Manrope',sans-serif;">
          {{ t('subscription.changePlan') }}
        </h1>
        <p class="text-color-secondary mt-1 mb-0">{{ t('subscription.choosePlanSubtitle') }}</p>
      </div>
    </div>

    <div v-if="!plansLoaded" class="flex justify-content-center py-6">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem;"></i>
    </div>

    <template v-else>
      <div class="grid mt-3">
        <div v-for="plan in plans" :key="plan.name" class="col-12 md:col-4">
          <div :style="{
                 border:       isHighlight(plan) ? '2px solid #007BFF' : '2px solid #e2e8f0',
                 borderRadius: '16px', padding: '24px', height: '100%',
                 background:   isHighlight(plan) ? 'linear-gradient(135deg,#f0f7ff 0%,#ffffff 100%)' : 'white',
                 position:     'relative',
                 boxShadow:    isHighlight(plan) ? '0 4px 20px rgba(0,123,255,.12)' : '0 1px 4px rgba(0,0,0,.05)',
               }">
            <div v-if="isHighlight(plan)" style="position:absolute;top:-14px;left:50%;transform:translateX(-50%);
                 background:#007BFF;color:white;padding:4px 16px;border-radius:20px;font-size:0.75rem;font-weight:700;white-space:nowrap;">
              ⭐ {{ t('subscription.mostPopular') }}
            </div>

            <p class="font-bold m-0 mb-3" style="font-size:1.2rem;">{{ plan.name }}</p>

            <div class="mb-1">
              <span style="font-size:2.2rem;font-weight:800;color:#007BFF;">
                S/ {{ plan.monthlyCost.toLocaleString('es-PE') }}
              </span>
              <span class="text-color-secondary text-sm"> / {{ t('subscription.month') }}</span>
            </div>
            <p class="text-xs text-color-secondary mb-3">{{ t('subscription.billedMonthly') }}</p>

            <div class="mb-3 p-2" style="background:#f8fafc;border-radius:8px;">
              <span class="text-sm font-medium">
                <i class="pi pi-database mr-1" style="color:#007BFF;"></i>
                {{ plan.isUnlimited ? t('subscription.unlimitedDevices') : t('subscription.upToDevices', { n: plan.maxDevices }) }}
              </span>
            </div>

            <ul class="list-none p-0 m-0 mb-4">
              <li v-for="f in featuresOf(plan)" :key="f" class="flex align-items-start gap-2 mb-2">
                <i class="pi pi-check-circle mt-1" style="color:#10B981;font-size:0.85rem;flex-shrink:0;"></i>
                <span class="text-sm">{{ f }}</span>
              </li>
            </ul>

            <pv-button
                v-if="plan.name !== currentPlanName"
                :label="`${t('subscription.choose')} ${plan.name}`"
                :outlined="!isHighlight(plan)"
                class="w-full"
                @click="choosePlan(plan)" />
            <div v-else class="w-full text-center py-2" style="border:2px solid #10B981;border-radius:8px;">
              <span style="color:#10B981;font-weight:600;font-size:0.9rem;">✓ {{ t('subscription.currentPlan') }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <pv-dialog v-model:visible="showConfirm" :header="t('subscription.confirmChange')" :modal="true" :style="{ width: '420px' }">
      <div v-if="selectedPlan" class="flex flex-column gap-2 pt-2">
        <p class="m-0">{{ t('subscription.confirmChangeTo') }} <strong>{{ selectedPlan.name }}</strong>?</p>
        <div style="background:#f8fafc;border-radius:8px;padding:12px;" class="mt-2">
          <p class="m-0 text-sm">
            <span class="text-color-secondary">{{ t('subscription.newPrice') }}:</span>
            <strong> S/ {{ selectedPlan.monthlyCost.toLocaleString('es-PE') }}/{{ t('subscription.month') }}</strong>
          </p>
          <p class="m-0 text-sm mt-1">
            <span class="text-color-secondary">{{ t('subscription.deviceLimit') }}:</span>
            <strong> {{ selectedPlan.isUnlimited ? t('subscription.unlimited') : selectedPlan.maxDevices }}</strong>
          </p>
        </div>
        <div v-if="errorMsg" class="mt-2 p-2" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;color:#b91c1c;">
          <i class="pi pi-exclamation-circle mr-2"></i>{{ errorMsg }}
        </div>
      </div>
      <template #footer>
        <pv-button :label="t('option.cancel')" text @click="showConfirm = false" />
        <pv-button :label="t('subscription.confirmButton')" icon="pi pi-check" :loading="saving" @click="confirmChange" />
      </template>
    </pv-dialog>
  </div>
</template>

<style scoped>
</style>
