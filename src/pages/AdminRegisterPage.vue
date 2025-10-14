<template>
  <div class="q-pa-md form-container">
    <div class="column items-center">
      <label class="form-title">SIGN UP</label>
      <label class="subtitle-logsign">Let's Get You Set Up</label>
    </div>

    <div class="column q-gutter-sm q-mt-md">
      <q-form @submit.prevent="registerAdmin">
        <div class="row items-center q-gutter-lg">
          <label class="labelNames">First Name</label>
          <q-input
            filled
            dense
            v-model="form.first_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your first name.']"
            class="text-box"
            style="width: 25.8rem"
          />
        </div>
        <div class="row items-center q-gutter-lg">
          <label class="labelNames">Last Name</label>
          <q-input
            filled
            dense
            v-model="form.last_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your last name.']"
            class="text-box"
            style="width: 25.8rem"
          />
        </div>

        <div class="row">
          <div class="col">
            <label class="labelNames">Email</label>
            <q-input
              filled
              dense
              type="email"
              v-model="form.email"
              :rules="[
                (val) => !!val || 'Please enter your email.',
                (val) =>
                  val.includes('@iskolarngbayan.pup.edu.ph') || 'Please use your PUP email only',
                checkEmailUnique,
              ]"
              class="text-box-2 q-mr-lg"
            />
          </div>
          <div class="col">
            <label class="labelNames">Contact Number</label>
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

        <label class="labelNames">Password</label>
        <q-input
          filled
          dense
          type="password"
          v-model="form.password"
          :hint="passwordStrength"
          :color="passwordStrengthColor"
          class="text-box"
        />

        <label class="labelNames">Confirm Password</label>
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
            <router-link to="/user/login" class="signup-login-link">Log In</router-link>
          </label>
        </div>
      </q-form>
    </div>
  </div>

  <!-- Message Dialog -->
  <q-dialog v-model="notifyDialogOpen">
    <q-card class="sucess-add-to-collection">
      <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
        notifyDialogTitle
      }}</q-card-section>
      <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
        notifyDialogMessage
      }}</q-card-section>
      <q-card-actions>
        <q-btn flat label="Okay" class="btn-save" v-close-popup @click="handleNotifyDialogClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { getFrontendUrl } from 'src/utils/frontendUrl'

const router = useRouter()

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  contact: '',
  password: '',
  confirmPassword: '',
})

// Check if email already exists in all_users table
const checkEmailUnique = async (val) => {
  if (!val) return true

  const { data, error } = await supabase
    .from('all_users')
    .select('id')
    .eq('email', val)
    .maybeSingle()

  if (error) {
    console.error(error)
    return true
  }

  return !data || 'An account with this email already exists. Please use a different email.'
}

// Password strength status
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

  if (!first_name || !last_name || !email || !contact) {
    alert('Please fill out all required fields.')
    return
  }

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
          type: 'admin',
        },
  emailRedirectTo: `${getFrontendUrl()}/user/login`,
      },
    })

    if (error) {
      alert(error.message)
      return
    }

    const now = new Date()

    if (data.user) {
      const { error: insertError } = await supabase.from('registered_admins').insert([
        {
          id: data.user.id,
          first_name,
          last_name,
          email,
          contact,
          is_super_admin: false, // Regular admin registration cannot create super admins
          is__temp_password: true,
          created_at: new Date(),
        },
      ])

      if (insertError) {
        console.error(insertError)
        alert('User created, but failed to save admin profile.')
        return
      }

      const { error: allUserError } = await supabase.from('all_users').insert([
        {
          id: data.user.id,
          email,
          created_at: now,
          user_type: 'admin',
        },
      ])

      if (allUserError) {
        console.error('Error in adding user to all users table: ', allUserError)
        return
      }

      await showNotifyDialog(
        'Success',
        'Registration successful! Please check your email to authenticate your account.',
      )
      router.push('/user/login')
    }
  } catch (err) {
    console.error(err)
    alert('An unexpected error occurred.')
  }
}

// Notification dialog state
const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')
const dialogResolve = ref(null)

function showNotifyDialog(title, message) {
  return new Promise((resolve) => {
    notifyDialogTitle.value = title
    notifyDialogMessage.value = message
    notifyDialogOpen.value = true

    dialogResolve.value = resolve
  })
}

function handleNotifyDialogClose() {
  notifyDialogOpen.value = false
  if (dialogResolve.value) {
    dialogResolve.value()
    dialogResolve.value = null
  }
}
</script>

<style scoped>
.labelNames {
  margin-bottom: 1rem;
}
</style>
