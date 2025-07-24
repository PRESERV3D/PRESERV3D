<template>
  <div class="q-pa-md form-container">
    <div class="column items-center q-mb-md">
      <label class="form-title">LOG IN</label>
      <label class="subtitle-logsign">Access Your Account</label>
    </div>

    <q-form @submit.prevent="loginUser">
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
          <router-link to="/user/register-option" name="user-options" class="signup-login-link">
            Sign Up
          </router-link>
        </label>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
// import { useUserStore } from 'src/stores/user'

const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)

async function loginUser() {
  const { email, password } = form.value

  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      alert(error.message || 'Login failed.')
      return
    }

    const user = data.user

    if (!user) {
      alert('Login failed. User data not returned.')
      return
    }

    const role = user.user_metadata?.role

    if (!role) {
      alert('Access denied. User role not defined.')
      await supabase.auth.signOut()
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('registered_users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.warn('Could not load user profile:', profileError.message)
    } else {
      console.log('User profile:', profile)
    }

    // Redirect based on role
    if (role === 'admin') {
      alert('Welcome, Admin!')
      await router.push('/admindash')
    } else if (role === 'user') {
      alert('Welcome, PUPian!')
      await router.push('/home')
    } else {
      alert('Access denied. Unknown role.')
      await supabase.auth.signOut()
    }
  } catch (err) {
    console.error('Login error:', err)
    alert('An unexpected error occurred. Check the console for details.')
  }
}
</script>
