<template>
  <div class="q-pa-md form-container">
    <div class="column items-center q-mb-md">
      <label class="form-title">SIGN UP</label>
      <label class="subtitle">Let's Get You Set Up</label>
    </div>
    <div class="column q-gutter-sm">
      <q-form @submit.prevent="registerAdmin">
        <label class="names">First Name</label>
        <q-input
          filled
          dense
          v-model="form.first_name"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your first name.']"
          class="text-box"
        />
        <label class="names">Last Name</label>
        <q-input
          filled
          dense
          v-model="form.last_name"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your last name.']"
          class="text-box"
        />
        <div class="row">
          <div class="col q-gutter-sm">
            <label class="names">Email</label>
            <q-input
              filled
              dense
              v-model="form.email"
              type="email"
              lazy-rules
              :rules="[
                (val) => !!val || 'Please enter your email.',
                (val) =>
                  val.includes('@iskolarngbayan.pup.edu.ph') || 'Please use your PUP email only.',
              ]"
              class="text-box-2 q-mr-lg"
            />
          </div>
          <div class="col q-gutter-sm">
            <label class="names">Contact Number</label>
            <q-input
              filled
              dense
              v-model="form.contact"
              lazy-rules
              :rules="[(val) => !!val || 'Please enter your contact number.']"
              class="text-box-2"
            />
          </div>
        </div>

        <label class="names">Password</label>
        <q-input
          filled
          dense
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
          class="text-box"
        />
        <label class="names">Confirm Password</label>
        <q-input
          filled
          dense
          v-model="form.confirmPassword"
          type="password"
          lazy-rules
          :rules="[
            (val) => !!val || 'Please confirm your password.',
            (val) => val === form.password || 'Passwords do not match.',
          ]"
          class="text-box"
        />
        <div class="column items-center q-pt-xs">
          <q-btn
            class="sign-up"
            push
            color="primary"
            text-color="white"
            label="SIGN UP"
            @click="registerAdmin"
          />
        </div>

        <div class="column items-center q-mb-xs">
          <label class="already">
            Already have an account?
            <router-link to="/admin/login" name="admin-login" class="signup-login-link"
              >Log In</router-link
            >
          </label>
        </div>
      </q-form>
    </div>
  </div>
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
      router.push('/admin/login')
    }
  } catch (error) {
    alert('An error occurred.')
    console.error(error)
  }
}
</script>
