<template>
  <div class="q-pa-md form-container">
    <div class="column items-center q-mb-md">
      <label class="form-title">LOG IN</label>
      <label class="subtitle-logsign">Access Your Account</label>
    </div>
    <q-form @submit.prevent="loginAdmin">
      <div class="column q-gutter-sm">
        <label class="labelNames">Email</label>
        <q-input
          filled
          v-model="form.email"
          type="email"
          lazy-rules
          :rules="[
            (val) => !!val || 'Please enter your email.',
            (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Use your PUP email only.',
          ]"
          class="login-text-box"
        />
        <label class="labelNames">Password</label>
        <q-input
          filled
          v-model="form.password"
          :type="showPassword ? 'text' : 'password'"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your password.']"
          class="login-text-box"
        >
          <template v-slot:append>
            <q-icon
              :name="showPassword ? 'visibility' : 'visibility_off'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>
      </div>

      <div class="text-right full-width no-gutter-top">
        <a href="/forgot-password" class="forgot-password-link">Forgot Password</a>
      </div>
      <div class="column items-center q-pt-md">
        <q-btn label="Log In" type="submit" class="log-in" />
      </div>
      <div class="column items-center q-mt-md">
        <label class="already">
          Don't have an account?
          <router-link to="/admin/register" name="admin-register" class="signup-login-link"
            >Sign Up</router-link
          >
        </label>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useUserStore } from 'src/stores/user'

const userStore = useUserStore()
await userStore.signOut()

const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)

async function loginAdmin() {
  const { email, password } = form.value

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert(error.message || 'Login failed.')
      return
    }

    // Fetch session and profile from your user store
    await userStore.fetchSession()

    if (userStore.profile?.role === 'admin') {
      alert('Login successful!')
      router.push('/admindash')
    } else {
      alert('Access denied. You are not authorized as an admin.')
      await supabase.auth.signOut()
    }
  } catch (err) {
    alert('An unexpected error occurred.')
    console.error(err)
  }
}
</script>
