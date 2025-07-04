<template>
  <div class="q-pa-md form-container">
    <div class="column items-center">
      <label class="form-title">SIGN UP</label>
      <label class="subtitle">Let's Get You Set Up</label>
    </div>

    <div class="column q-gutter-sm">
      <q-form @submit.prevent="registerAdmin">
        <div class="row items-center q-gutter-lg q-mt-xs">
          <label class="names">First Name</label>
          <q-input filled dense v-model="form.first_name" class="text-box" style="width: 25.8rem" />
        </div>
        <div class="row items-center q-gutter-lg q-mt-sm">
          <label class="names">Last Name</label>
          <q-input filled dense v-model="form.last_name" class="text-box" style="width: 25.8rem" />
        </div>

        <div class="row q-mt-lg">
          <div class="col">
            <label class="names">Email</label>
            <q-input
              filled
              dense
              type="email"
              v-model="form.email"
              :rules="[
                (val) => !!val || 'Email required',
                (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Use your PUP email only',
              ]"
              class="text-box-2 q-mr-lg"
            />
          </div>
          <div class="col">
            <label class="names">Contact Number</label>
            <q-input filled dense v-model="form.contact" class="text-box-2" />
          </div>
        </div>

        <label class="names">Password</label>
        <q-input
          filled
          dense
          type="password"
          v-model="form.password"
          :hint="passwordStrength"
          :color="passwordStrengthColor"
          class="text-box"
        />

        <label class="names">Confirm Password</label>
        <q-input
          filled
          dense
          type="password"
          v-model="form.confirmPassword"
          :rules="[
            (val) => !!val || 'Confirm your password',
            (val) => val === form.password || 'Passwords do not match',
          ]"
          class="text-box"
        />
        <div class="column items-center">
          <q-btn
            class="sign-up"
            push
            color="primary"
            text-color="white"
            label="SIGN UP"
            type="submit"
          />
        </div>

        <div class="column items-center q-mt-md">
          <label class="already">
            Already have an account?
            <router-link to="/admin/login" class="signup-login-link">Log In</router-link>
          </label>
        </div>
      </q-form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'

const router = useRouter()

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  contact: '',
  password: '',
  confirmPassword: '',
})

// Password strength
const passwordStrength = computed(() => {
  const pwd = form.value.password
  const strong =
    /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd) && pwd.length >= 8
  return pwd ? (strong ? 'Strong' : 'Weak') : ''
})

const passwordStrengthColor = computed(() =>
  passwordStrength.value === 'Strong' ? 'green' : 'red',
)

// Register admin
async function registerAdmin() {
  const { first_name, last_name, email, contact, password, confirmPassword } = form.value

  if (!email.includes('@iskolarngbayan.pup.edu.ph')) {
    alert('Please use your PUP email only.')
    return
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match!')
    return
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
  if (!passwordRegex.test(password)) {
    alert(
      'Password must be at least 8 characters and include uppercase, number, and special character.',
    )
    return
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'admin',
        },
        redirectTo: 'http://localhost:9000/#/user/login',
      },
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      const { error: insertError } = await supabase.from('registered_admins').insert([
        {
          id: data.user.id,
          first_name,
          last_name,
          email,
          contact,
          created_at: new Date(),
        },
      ])

      if (insertError) {
        console.error(insertError)
        alert('User created, but failed to save admin profile.')
        return
      }

      alert('Registration successful! Please check your email to confirm your account.')
      router.push('/user/login')
    }
  } catch (err) {
    console.error(err)
    alert('An unexpected error occurred.')
  }
}
</script>
