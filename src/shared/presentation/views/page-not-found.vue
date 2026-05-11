<script setup>
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

const { t } = useI18n();
const route = useRoute();
</script>

<template>
  <div class="flex flex-column align-items-center justify-content-center" style="min-height: 60vh;">
    <i class="pi pi-exclamation-triangle" style="font-size: 4rem; color: #007BFF;"></i>
    <h1 class="mt-3">{{ t('page-not-found.title') }}</h1>
    <p>{{ t('page-not-found.content', { 'unavailable-route': route.path }) }}</p>
    <router-link to="/">
      <pv-button :label="t('page-not-found.go-home')" icon="pi pi-home" class="mt-3" />
    </router-link>
  </div>
</template>
