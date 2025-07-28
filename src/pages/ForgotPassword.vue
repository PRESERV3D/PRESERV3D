<template>
  <div class="q-pa-md">
    <div class="column items-center">
      <label class="text-h5">Forgot Password</label>
      <q-form @submit.prevent="sendResetEmail" class="q-mt-md">
        <q-input
          filled
          v-model="email"
          label="PUP Email"
          type="email"
          lazy-rules
          :rules="[
            (val) => !!val || 'Enter your email.',
            (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Use your PUP email only.',
          ]"
          class="q-mb-md"
        />
        <q-btn label="Send Reset Email" type="submit" color="primary" />
      </q-form>
      <q-banner v-if="message" class="q-mt-md">{{ message }}</q-banner>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from 'boot/supabase'

const email = ref('')
const message = ref('')

// Check if email exists
async function checkEmail() {
  const { data, error } = await supabase
    .from('registered_users')
    .select('email')
    .eq('email', email.value)
    .single()

  if (error) {
    console.error('Error checking email:', error.message)
    return false
  }
  return data ? true : false
}

async function sendResetEmail() {
  const emailExists = await checkEmail()
  if (!emailExists) {
    message.value = 'Email not found.'
    return
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: 'http://localhost:9000/user/reset-password',
  })

  message.value = error ? error.message : 'Reset link sent! Check your email.'
}
</script>
