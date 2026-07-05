<script setup>
import useIamStore from "../../application/iam.store.js";
import { reactive, ref } from "vue";
import { SignInCommand } from "../../domain/sign-in.command.js";
import { useRouter } from "vue-router";

const router = useRouter();
const store = useIamStore();
const { signIn } = store;
const form = reactive({ email: '', password: '' });
const errorMsg = ref('');

function performSignIn() {
  errorMsg.value = '';
  if (!form.email || !form.password) {
    errorMsg.value = 'Correo y contraseña son obligatorios.';
    return;
  }
  const signInCommand = new SignInCommand(form);
  signIn(signInCommand, router);
}
</script>

<template>
  <div class="p-4" style="max-width: 420px; margin: 0 auto;">
    <h3 class="mb-1">Iniciar sesión</h3>
    <p class="text-color-secondary mb-4">Ingresa tus credenciales.</p>

    <form @submit.prevent="performSignIn">
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

        <div v-if="errorMsg" class="p-2" style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;color:#b91c1c;">
          {{ errorMsg }}
        </div>

        <pv-button type="submit" label="Entrar" class="mt-2" />

        <p class="text-center text-sm mt-2">
          ¿No tienes cuenta?
          <a href="#" @click.prevent="router.push({ name: 'iam-sign-up' })" style="color:#007BFF;">Regístrate</a>
        </p>
      </div>
    </form>
  </div>
</template>

<style scoped></style>
