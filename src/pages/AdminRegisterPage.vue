<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="registerAdmin">
      <p>First Name</p>
      <q-input
        filled
        v-model="form.first_name"
        lazy-rules
        :rules="[(val) => !!val || 'Please enter your first name.']"
      />
      <p>Last Name</p>
      <q-input
        filled
        v-model="form.last_name"
        lazy-rules
        :rules="[(val) => !!val || 'Please enter your last name.']"
      />
      <p>Email</p>
      <q-input
        filled
        v-model="form.email"
        type="email"
        lazy-rules
        :rules="[
          (val) => !!val || 'Please enter your email.',
          (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Please use your PUP email only.',
        ]"
      />
      <p>Contact Number</p>
      <q-input
        filled
        v-model="form.contact"
        lazy-rules
        :rules="[(val) => !!val || 'Please enter your contact number.']"
      />

      <p>Password</p>
      <q-input
        filled
        v-model="form.password"
        type="password"
        :hint="passwordStrength"
        :color="passwordStrengthColor"
        lazy-rules
        :rules="[
          (val) => !!val || 'Please enter your password.',
          (val) => val.length >= 8 || 'Must be at least 8 characters long.',
          (val) =>
            (/[A-Z]/.test(val) && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)) ||
            'Must contain an uppercase letter, a number, and a special character.',
        ]"
      />
      <p>Confirm Password</p>
      <q-input
        v-model="form.confirmPassword"
        type="password"
        lazy-rules
        :rules="[
          (val) => !!val || 'Please confirm your password.',
          (val) => val === form.password || 'Passwords do not match.',
        ]"
      />
      <q-btn label="Register" @click="registerAdmin" color="primary" />
    </q-form>
  </q-page>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  contact: '',
  password: '',
  confirmPassword: '',
})

// Password strength status
const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return ''

  const hasUpper = /[A-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd)
  const isLongEnough = pwd.length >= 8

  return hasUpper && hasNumber && hasSpecial && isLongEnough ? 'Strong' : 'Weak'
})

const passwordStrengthColor = computed(() =>
  passwordStrength.value === 'Strong' ? 'green' : 'red',
)

// Register admin
async function registerAdmin() {
  const { first_name, last_name, email, contact, password, confirmPassword } = form.value

  const isValidEmail = email && email.includes('@iskolarngbayan.pup.edu.ph')

  if (!isValidEmail) {
    alert('Please use your PUP email only.')
    return
  }

  if (!first_name || !last_name || !email || !contact || !password || !confirmPassword) {
    alert('Please fill out all required fields.')
    return
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match!')
    return
  }

  try {
    const response = await fetch('http://localhost:3000/register-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form.value),
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.error || 'Registration failed.')
    } else {
      alert('Registration successful!')
      router.push('/admin-login')
    }
  } catch (error) {
    alert('An error occurred.')
    console.error(error)
  }
}
</script>
