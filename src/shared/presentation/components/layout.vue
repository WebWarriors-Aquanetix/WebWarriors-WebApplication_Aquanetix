<script setup>
import { useI18n } from 'vue-i18n';

const { locale, availableLocales } = useI18n();
</script>

<template>
  <!-- Mismo componente que el learning-center: pv-select-button -->
  <!-- El override de color en style scoped corrige el contraste sobre el toolbar azul -->
  <pv-select-button v-model="locale" :options="availableLocales">
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>

<style scoped>
/* Override: fuerza que el SelectButton sea legible sobre el toolbar bg-primary (#007BFF).
   El componente seleccionado queda blanco con texto azul;
   el no seleccionado queda transparente con borde y texto blancos. */
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
