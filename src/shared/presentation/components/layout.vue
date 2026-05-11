<script setup>
import LanguageSwitcher from './language-switcher.vue';
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const drawer = ref(false);

const items = [
  { label: 'option.dashboard',    to: '/monitoring/dashboard' },
  { label: 'option.sensors',      to: '/monitoring/sensors' },
  { label: 'option.alerts',       to: '/monitoring/alerts' },
  { label: 'option.subscription', to: '/monitoring/subscription' },
];

const toggleDrawer = () => {
  drawer.value = !drawer.value;
};
</script>

<template>
  <pv-toast />
  <pv-confirm-dialog />

  <div class="header">
    <pv-toolbar class="bg-primary">
      <template #start>
        <pv-button class="p-button-text" icon="pi pi-bars" @click="toggleDrawer" />
        <!-- Manrope para el brand name, peso 700, igual que el Style Guide -->
        <h3 style="font-family: 'Manrope', sans-serif; font-weight: 700; color: white; margin: 0 0 0 8px; letter-spacing: 0.5px;">
          Aquanetix
        </h3>
      </template>
      <template #center></template>
      <template #end>
        <div class="flex gap-2 mr-3">
          <pv-button v-for="item in items" :key="item.label" as-child v-slot="slotProps">
            <router-link :to="item.to" :class="slotProps['class']">
              {{ t(item.label) }}
            </router-link>
          </pv-button>
        </div>
        <language-switcher />
      </template>
    </pv-toolbar>
    <pv-drawer v-model:visible="drawer" />
  </div>

  <!-- main-content: fondo slate del Style Guide, padding múltiplo de 8px -->
  <div class="main-content">
    <router-view />
  </div>

  <!-- Footer: verde bosque del Style Guide -->
  <div style="background: var(--color-forest); padding: 12px 24px; text-align: center;">
    <p class="m-0 text-sm" style="color: rgba(255,255,255,0.8); font-family: 'Inter', sans-serif;">
      © 2026 Aquanetix — Water Quality Monitoring Platform
    </p>
  </div>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 100;
  width: 100%;
}

/* padding y min-height en múltiplos de 8px (base-8 del Style Guide) */
.main-content {
  padding: 24px;           /* 3 × 8px */
  background: var(--color-slate);
  min-height: calc(100vh - 104px);
}
</style>
