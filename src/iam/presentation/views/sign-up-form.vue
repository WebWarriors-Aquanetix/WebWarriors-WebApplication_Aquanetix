<script setup>
import useIamStore from "../../application/iam.store.js";
import { reactive, ref, onMounted } from "vue";
import { SignUpCommand } from "../../domain/sign-up.command.js";
import { useRouter } from "vue-router";
import { SubscriptionApi } from "../../../subscriptions/infrastructure/subscription-api.js";
import { SubscriptionAssembler } from "../../../subscriptions/infrastructure/subscription.assembler.js";

const router = useRouter();
const store = useIamStore();
const { signUp } = store;

const form = reactive({ email: '', password: '', plan: '' });
const plans = ref([]);
const errorMsg = ref('');

onMounted(async () => {
  // Load real plans from the backend so the user chooses a valid one.
  try {
    const api = new SubscriptionApi();
    const response = await api.getPlans();
    plans.value = SubscriptionAssembler.toPlansFromResponse(response);
    if (plans.value.length && !form.plan) form.plan = plans.value[0].name;
  } catch (e) {
    // If plans can't load, fall back to the known names.
    plans.value = [
      { name: 'Basic' }, { name: 'Smart City' }, { name: 'Industrial' }
    ];
    form.plan = 'Basic';
  }
});

function performSignUp() {
  errorMsg.value = '';
  if (!form.email || !form.password || !form.plan) {
    errorMsg.value = 'Todos los campos son obligatorios.';
    return;
  }
  const signUpCommand = new SignUpCommand(form);
  signUp(signUpCommand, router);
}
</script>

<template>
  <div class="p-4" style="max-width: 420px; margin: 0 auto;">
    <h3 class="mb-1">Crear cuenta</h3>
    <p class="text-color-secondary mb-4">Regístrate y elige tu plan.</p>

    <form @submit.prevent="performSignUp">
      <div class="p-fluid flex flex-column gap-3">
        <div class="field">
          <label for="email" class="block mb-1">Correo</label>
          <pv-input-text id="email" v-model="form.email" type="email"
                         :class="{'p-invalid': !form.email}" placeholder="tucorreo@ejemplo.com" />
        </div>

        <div class="field">
          <label for="password" class="block mb-1">Contraseña</label>
          <pv-input-text id="password" v-model="form.password" type="password"
                         :class="{'p-invalid': !form.password}" placeholder="••••••" />
        </div>

        <div class="field">
          <label for="plan" class="block mb-1">Plan</label>
          <select id="plan" v-model="form.plan"
                  style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:6px;">
            <option v-for="p in plans" :key="p.name" :value="p.name">
              {{ p.name }}<template v-if="p.monthlyCost"> — S/ {{ p.monthlyCost }}/mes</template>
            </option>
          </select>
        </div>

        <div v-if="errorMsg" class="p-2" style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#b91c1c;">
          {{ errorMsg }}
        </div>

        <pv-button type="submit" label="Registrarme" class="mt-2" />

        <p class="text-center text-sm mt-2">
          ¿Ya tienes cuenta?
          <a href="#" @click.prevent="router.push({ name: 'iam-sign-in' })" style="color:#007BFF;">Inicia sesión</a>
        </p>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
