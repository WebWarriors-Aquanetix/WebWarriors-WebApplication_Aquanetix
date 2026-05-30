<script setup>
import LanguageSwitcher from './language-switcher.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const items = [
  { label: 'option.dashboard',    to: '/monitoring/dashboard' },
  { label: 'option.sensors',      to: '/monitoring/sensors' },
  { label: 'option.alerts',       to: '/monitoring/alerts' },
  { label: 'option.subscription', to: '/monitoring/subscription' },
];
</script>

<template>
  <pv-toast />
  <pv-confirm-dialog />

  <div class="header">
    <pv-toolbar class="bg-primary">
      <template #start>
        <!-- Logo + nombre -->
        <div class="flex align-items-center gap-2">
          <img
              src="/Aquanetix_Logo.png"
              alt="Aquanetix"
              style="height: 36px; width: auto; object-fit: contain;"
          />
          <h3 style="font-family:'Manrope',sans-serif;font-weight:700;color:white;margin:0;letter-spacing:0.5px;">
            Aquanetix
          </h3>
        </div>
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
  </div>

  <div class="main-content">
    <router-view />
  </div>

  <div style="background:var(--color-forest);padding:12px 24px;text-align:center;">
    <p class="m-0 text-sm" style="color:rgba(255,255,255,0.8);font-family:'Inter',sans-serif;">
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

.main-content {
  padding: 24px;
  background: var(--color-slate);
  min-height: calc(100vh - 104px);
}
</style>