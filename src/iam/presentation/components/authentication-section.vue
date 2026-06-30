<script setup>
import useIamStore from "../../application/iam.store.js";
import {useRouter} from "vue-router";
import {computed} from "vue";

const router = useRouter();
const store = useIamStore();

let isSignedIn = computed(() => !!store.isSignedIn);
let currentUsername = computed(() => store.currentUsername);
</script>

<template>
  <div>
    <div v-if="isSignedIn">
      <span class="p-button-text bg-primary"> Welcome, {{ currentUsername }}</span>
      <pv-button class="bg-primary" text>Sign Out</pv-button>
    </div>
    <div v-else>
      <pv-button class="bg-primary" text>Sign In</pv-button>
      <pv-button class="bg-primary" text>Sign Up</pv-button>
    </div>
  </div>
</template>

<style scoped>

</style>