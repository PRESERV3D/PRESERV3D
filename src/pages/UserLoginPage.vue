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
            // (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Use your PUP email only.',
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
        <router-link to="/forgotpassword" class="forgot-password-link">Forgot Password</router-link>
      </div>

      <!-- Error message -->
      <!-- Login attempt counter -->
      <div
        v-if="message"
        :class="messageType === 'error' ? 'text-red' : 'text-green'"
        class="q-mt-md text-center"
      >
        {{ message }}
      </div>

      <!-- Cooldown Message -->
      <div v-if="cooldownActive" class="text-red text-center q-mt-sm">
        Too many failed attempts. Please wait {{ cooldownTime }} seconds before trying again.
      </div>

      <div class="column items-center q-pt-md">
        <q-btn label="Log In" type="submit" class="log-in" :disable="cooldownActive" />
      </div>

      <div class="column items-center q-mt-md">
        <label class="already">
          Don't have an account?
          <router-link to="/user/register-option" name="user-options" class="signup-login-link">
            Sign Up
          </router-link>
        </label>
        <!--Terms and Conditions Checkbox -->

        <div class="terms-font q-mt-lg" style="text-align: center">
          By using this service, you understood and agree <br />to the PUP Online Services
          <a
            href="https://www.pup.edu.ph/terms/"
            target="_blank"
            class="terms-font"
            style="text-decoration: underline; color: #560505"
          >
            Terms of Use
          </a>
          and
          <a
            href="https://www.pup.edu.ph/privacy/"
            target="_blank"
            class="terms-font"
            style="text-decoration: underline; color: #560505"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useQuasar } from 'quasar'
// import { useUserStore } from 'src/stores/user'

const $q = useQuasar()
const router = useRouter()

const form = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)

// ADDED: Login attempt tracking
const message = ref('')
const messageType = ref('')
const loginAttempts = ref(0)
const cooldownActive = ref(false)
const cooldownTime = ref(0)
const maxAttempts = 3
const remainingAttempts = computed(() => maxAttempts - loginAttempts.value)
let cooldownInterval = null

async function loginUser() {
  if (cooldownActive.value) return

  message.value = ''
  messageType.value = ''

  const { email, password } = form.value

  try {
    // Find user by email in all_users
    const { data: profile, error: profileError } = await supabase
      .from('all_users')
      .select('id, user_type')
      .eq('email', email)
      .maybeSingle()

    if (profileError) {
      console.error('Profile lookup failed:', profileError.message)
      alert('Unable to verify user. Please try again.')
      return
    }

    if (!profile) {
      const { data: visitorRegistration, error: visitorRegisError } = await supabase
        .from('registration_visitors')
        .select('status')
        .eq('email', email)
        .maybeSingle()

      if (visitorRegisError) {
        console.error('Registration lookup failed:', visitorRegisError.message)
        alert('Unable to verify registration status. Please try again.')
        return
      }

      if (visitorRegistration) {
        if (visitorRegistration.status === 'Pending') {
          alert('Please wait for the admin to evaluate your registration.')
        } else if (visitorRegistration.status === 'Rejected') {
          alert('Sorry. Your registration has been Rejected.')
        } else {
          alert('Your registration is not approved yet.')
        }
      } else {
        alert('No account found with this email.')
      }
      return // Do not proceed to login
    }

    // If visitor, check status before signing in
    if (profile.user_type === 'visitor') {
      const { data: visitorStatus, error: visitorError } = await supabase
        .from('approved_visitors_status')
        .select('access_status')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (visitorError) {
        console.error('Visitor status lookup failed:', visitorError.message)
        alert('Unable to verify visitor status. Please try again.')
        return
      }

      const accessStatus = visitorStatus?.access_status

      if (accessStatus !== 'Active') {
        if (accessStatus === 'Expired') {
          alert('Your access has expired.')
        } else if (accessStatus === 'Not Started') {
          alert('Your access date has not started yet.')
        } else if (accessStatus === 'Pending Confirmation') {
          alert(
            'Please check your email for account authentication first and make sure to set a password.',
          )
        } else {
          alert('Access denied. Unknown visitor status.')
        }
        clearForm()
        return // Do not proceed to login
      }
    }

    // Proceed to login
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      loginAttempts.value++
      if (loginAttempts.value >= maxAttempts) {
        startCooldown(60)
        messageType.value = 'error'
        return
      }
      message.value = `Invalid login credentials. You have ${remainingAttempts.value} attempt/s remaining.`
      messageType.value = 'error'
      return
    }

    // Reset after success
    loginAttempts.value = 0
    cooldownActive.value = false

    const user = data.user
    if (!user) {
      message.value = 'Login failed. User data not returned.'
      messageType.value = 'error'
      return
    }

    const role = user.user_metadata?.role
    if (role === 'admin') {
      $q.notify({ type: 'positive', message: 'Welcome, Admin!', position: 'top' })
      await router.push('/admindash')
    } else if (role === 'user') {
      $q.notify({ type: 'positive', message: 'Welcome, User!', position: 'top' })
      await router.push('/home')
    } else {
      $q.notify({ type: 'warning', message: 'Access denied. Unknown user role.', position: 'top' })
      await supabase.auth.signOut()
    }

    // Ensure Favorites collection exists
    const { data: favoritesCollection } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', user.id)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (!favoritesCollection) {
      const { error: insertError } = await supabase.from('collections').insert([
        {
          collection_name: 'Favorites',
          description: 'Items you marked as favorite will appear here.',
          user_id: user.id,
          is_default: true,
          is_locked: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          cover_url:
            'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers/favoritescover.png',
        },
      ])

      if (insertError) {
        console.error('Insert collection failed:', insertError)
      }
    }
  } catch (err) {
    console.error('Login error:', err)
    alert('An unexpected error occurred. Check the console for details.')
  }
}

function clearForm() {
  form.value.email = ''
  form.value.password = ''
}

function startCooldown(seconds) {
  const endTime = Date.now() + seconds * 1000

  // Store cooldown end time in localStorage
  localStorage.setItem('cooldownEndTime', endTime)

  cooldownActive.value = true
  cooldownTime.value = seconds

  cooldownInterval && clearInterval(cooldownInterval)
  cooldownInterval = setInterval(() => {
    const remaining = Math.ceil((endTime - Date.now()) / 1000)
    cooldownTime.value = remaining > 0 ? remaining : 0

    if (remaining <= 0) {
      cooldownActive.value = false
      loginAttempts.value = 0
      localStorage.removeItem('cooldownEndTime')
      clearInterval(cooldownInterval)
    }
  }, 1000)
}

onMounted(() => {
  const savedEndTime = localStorage.getItem('cooldownEndTime')
  if (savedEndTime) {
    const remaining = Math.ceil((savedEndTime - Date.now()) / 1000)
    if (remaining > 0) {
      startCooldown(remaining)
    } else {
      localStorage.removeItem('cooldownEndTime')
    }
  }
})
</script>

<style scoped>
:deep(.login-text-box .q-field__control::before),
:deep(.login-text-box .q-field__control::after) {
  display: none !important;
}
</style>
