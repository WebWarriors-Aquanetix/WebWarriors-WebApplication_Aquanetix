<script setup>
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';

const { locale, availableLocales } = useI18n();

// Computed que evita deseleccionar el idioma activo
const selectedLocale = computed({
  get: () => locale.value,
  set: (val) => {
    if (val && val !== locale.value) {
      locale.value = val;
    }
  }
});
</script>

<template>
  <pv-select-button v-model="selectedLocale" :options="availableLocales" :allow-empty="false">
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>

<style scoped>
:deep(.p-selectbutton .p-togglebutton) {
  background: transparent;
  border-color: white;
  color: white;
}

:deep(.p-selectbutton .p-togglebutton.p-togglebutton-checked) {
  background: white;
  border-color: white;
  color: #007BFF;
}

:deep(.p-selectbutton .p-togglebutton:not(.p-togglebutton-checked):hover) {
  background: rgba(255, 255, 255, 0.15);
  color: white;
}
</style>