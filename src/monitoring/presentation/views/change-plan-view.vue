<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { ref, computed, toRefs, onMounted } from 'vue';
import useMonitoringStore from '../../application/monitoring.store.js';

const { t }  = useI18n();
const router = useRouter();
const store  = useMonitoringStore();

const { subscription, plans, plansLoaded } = toRefs(store);
const { fetchPlans, fetchSubscription, updateSubscription } = store;

onMounted(() => {
  if (!store.plansLoaded)        fetchPlans();
  if (!store.subscriptionLoaded) fetchSubscription();
});

// Toggle mensual / anual
const billing = ref('monthly');

// Precio a mostrar según ciclo seleccionado
const getPrice = (plan) =>
    billing.value === 'annual' ? plan.annualMonthlyPrice : plan.monthlyPrice;

const getAnnualTotal   = (plan) => (plan.monthlyPrice * 10).toLocaleString('es-PE');
const getAnnualSavings = (plan) => (plan.monthlyPrice * 2).toLocaleString('es-PE');

// Plan activo actual
const currentPlanName = computed(() => subscription.value?.plan ?? '');

// Confirmación
const selectedPlan = ref(null);
const showConfirm  = ref(false);

const choosePlan = (plan) => {
  selectedPlan.value = plan;
  showConfirm.value  = true;
};

const confirmChange = () => {
  if (!selectedPlan.value || !subscription.value) return;

  const updated = {
    ...subscription.value,
    plan:           selectedPlan.value.name,
    tier:           selectedPlan.value.tier,
    price:          getPrice(selectedPlan.value),
    billingCycle:   billing.value,
    features:       selectedPlan.value.features,
    usage: {
      ...subscription.value.usage,
      sensorsLimit: selectedPlan.value.maxSensors,
    },
  };

  updateSubscription(updated);
  showConfirm.value = false;
  router.push({ name: 'monitoring-subscription' });
};
</script>

<template>
  <div class="p-4">

    <!-- Header -->
    <div class="flex align-items-center gap-3 mb-2">
      <pv-button icon="pi pi-arrow-left" text @click="router.push({ name: 'monitoring-subscription' })" />
      <div>
        <h1 class="text-3xl font-bold m-0" style="font-family:'Manrope',sans-serif;">
          {{ t('subscription.changePlan') }}
        </h1>
        <p class="text-color-secondary mt-1 mb-0">
          {{ t('subscription.choosePlanSubtitle') }}
        </p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="!plansLoaded" class="flex justify-content-center py-6">
      <i class="pi pi-spin pi-spinner" style="font-size:2rem;"></i>
    </div>

    <template v-else>
      <!-- Billing toggle -->
      <div class="flex justify-content-center my-4">
        <div class="flex align-items-center gap-2 p-2" style="background:#f1f5f9;border-radius:12px;">
          <button
              @click="billing = 'monthly'"
              :style="{
                            padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer',
                            fontWeight:'600', fontSize:'0.9rem', fontFamily:'inherit',
                            background: billing === 'monthly' ? 'white' : 'transparent',
                            color:      billing === 'monthly' ? '#007BFF' : '#64748b',
                            boxShadow:  billing === 'monthly' ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                            transition: 'all .2s'
                        }"
          >
            {{ t('subscription.monthly') }}
          </button>
          <button
              @click="billing = 'annual'"
              :style="{
                            padding:'8px 20px', borderRadius:'8px', border:'none', cursor:'pointer',
                            fontWeight:'600', fontSize:'0.9rem', fontFamily:'inherit',
                            background: billing === 'annual' ? 'white' : 'transparent',
                            color:      billing === 'annual' ? '#007BFF' : '#64748b',
                            boxShadow:  billing === 'annual' ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
                            transition: 'all .2s'
                        }"
          >
            {{ t('subscription.annual') }}
            <span style="margin-left:6px;background:#10B981;color:white;padding:2px 8px;border-radius:10px;font-size:0.7rem;font-weight:700;">
                            {{ t('subscription.twoMonthsFree') }}
                        </span>
          </button>
        </div>
      </div>

      <!-- Plans grid -->
      <div class="grid">
        <div v-for="plan in plans" :key="plan.id" class="col-12 md:col-4">
          <div
              :style="{
                            border:       plan.highlight ? '2px solid #007BFF' : '2px solid #e2e8f0',
                            borderRadius: '16px',
                            padding:      '24px',
                            height:       '100%',
                            background:   plan.highlight ? 'linear-gradient(135deg,#f0f7ff 0%,#ffffff 100%)' : 'white',
                            position:     'relative',
                            boxShadow:    plan.highlight ? '0 4px 20px rgba(0,123,255,.12)' : '0 1px 4px rgba(0,0,0,.05)',
                        }"
          >
            <!-- Popular badge -->
            <div v-if="plan.highlight" style="
                            position:absolute;top:-14px;left:50%;transform:translateX(-50%);
                            background:#007BFF;color:white;padding:4px 16px;
                            border-radius:20px;font-size:0.75rem;font-weight:700;white-space:nowrap;">
              ⭐ {{ t('subscription.mostPopular') }}
            </div>

            <!-- Plan name -->
            <p class="font-bold m-0 mb-1" style="font-size:1.1rem;">{{ plan.name }}</p>
            <p class="text-xs text-color-secondary mb-3">{{ plan.tier }}</p>

            <!-- Price -->
            <div class="mb-1">
                            <span style="font-size:2.2rem;font-weight:800;color:#007BFF;">
                                S/ {{ getPrice(plan).toLocaleString('es-PE') }}
                            </span>
              <span class="text-color-secondary text-sm"> / {{ t('subscription.month') }}</span>
            </div>
            <p v-if="billing === 'annual'" class="text-xs mb-3" style="color:#10B981;font-weight:600;">
              S/ {{ getAnnualTotal(plan) }}/año · {{ t('subscription.youSave') }} S/ {{ getAnnualSavings(plan) }}
            </p>
            <p v-else class="text-xs text-color-secondary mb-3">
              {{ t('subscription.billedMonthly') }}
            </p>

            <!-- Features -->
            <ul class="list-none p-0 m-0 mb-4">
              <li v-for="f in plan.features" :key="f" class="flex align-items-start gap-2 mb-2">
                <i class="pi pi-check-circle mt-1" style="color:#10B981;font-size:0.85rem;flex-shrink:0;"></i>
                <span class="text-sm">{{ f }}</span>
              </li>
            </ul>

            <!-- CTA -->
            <pv-button
                v-if="plan.name !== currentPlanName"
                :label="`${t('subscription.choose')} ${plan.name}`"
                :outlined="!plan.highlight"
                class="w-full"
                @click="choosePlan(plan)"
            />
            <div v-else class="w-full text-center py-2" style="border:2px solid #10B981;border-radius:8px;">
              <span style="color:#10B981;font-weight:600;font-size:0.9rem;">✓ {{ t('subscription.currentPlan') }}</span>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Confirm dialog -->
    <pv-dialog
        v-model:visible="showConfirm"
        :header="t('subscription.confirmChange')"
        :modal="true"
        :style="{ width: '420px' }"
    >
      <div v-if="selectedPlan" class="flex flex-column gap-2 pt-2">
        <p class="m-0">
          {{ t('subscription.confirmChangeTo') }}
          <strong>{{ selectedPlan.name }}</strong>?
        </p>
        <div style="background:#f8fafc;border-radius:8px;padding:12px;" class="mt-2">
          <p class="m-0 text-sm">
            <span class="text-color-secondary">{{ t('subscription.newPrice') }}:</span>
            <strong> S/ {{ getPrice(selectedPlan).toLocaleString('es-PE') }}/{{ t('subscription.month') }}</strong>
          </p>
          <p class="m-0 text-sm mt-1">
            <span class="text-color-secondary">{{ t('subscription.cycle') }}:</span>
            <strong> {{ billing === 'annual' ? t('subscription.annual') : t('subscription.monthly') }}</strong>
          </p>
          <p v-if="billing === 'annual'" class="m-0 text-sm mt-1" style="color:#10B981;">
            {{ t('subscription.annualSavings') }}: S/ {{ getAnnualSavings(selectedPlan) }}
          </p>
        </div>
      </div>
      <template #footer>
        <pv-button :label="t('option.cancel')" text @click="showConfirm = false" />
        <pv-button :label="t('subscription.confirmButton')" icon="pi pi-check" @click="confirmChange" />
      </template>
    </pv-dialog>

  </div>
</template>

<style scoped>
</style>