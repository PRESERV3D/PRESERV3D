<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="loginUser">
      <p>Email</p>
      <q-input
        filled
        v-model="form.email"
        type="email"
        lazy-rules
        :rules="[
          (val) => !!val || 'Please enter your email.',
          (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Use your PUP email only.',
        ]"
      />
      <p>Password</p>
      <q-input
        filled
        v-model="form.password"
        type="password"
        lazy-rules
        :rules="[(val) => !!val || 'Please enter your password.']"
      />
      <q-btn label="Login" type="submit" color="primary" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

async function loginUser() {
  try {
    const response = await fetch('http://localhost:3000/login-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.error || 'Login failed.')
    } else {
      alert('Login successful!')
      console.log(data)
      router.push('/home')
    }
  } catch (error) {
    alert('An error occurred during login.')
    console.error(error)
  }
}
</script>
