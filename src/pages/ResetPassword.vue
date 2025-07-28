<template>
  <div class="q-pa-md">
    <div class="column items-center">
      <label class="text-h5">Reset Password</label>
      <q-form @submit.prevent="resetPassword" class="q-mt-md">
        <q-input
          filled
          v-model="newPassword"
          label="New Password"
          type="password"
          class="q-mb-md"
        />
        <q-banner v-if="message" class="q-mt-md">{{ message }}</q-banner>
        <q-btn label="Update Password" type="submit" color="primary" />
      </q-form>
      <router-link to="/user/login" class="q-mt-md">Back to Login</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from 'boot/supabase'
const newPassword = ref('')
const message = ref('')

// Supabase will auto-login user if they came via reset email
async function resetPassword() {
  const { error } = await supabase.auth.updateUser({
    password: newPassword.value,
  })

  message.value = error ? error.message : 'Password successfully updated!'
}
</script>
