<template>
  <div>
    <MobileNotSupported />

    <div class="q-pa-md form-container desktop-content">
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
            :rules="[(val) => !!val || 'Please enter your email.']"
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
          <router-link to="/forgotpassword" class="forgot-password-link"
            >Forgot Password</router-link
          >
        </div>

        <!-- Error message -->
        <div
          v-if="message"
          :class="messageType === 'error' ? 'text-red' : 'text-green'"
          class="q-mt-md text-center"
        >
          {{ message }}
        </div>
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
        </div>
      </q-form>

      <!-- Notification Dialog -->
      <q-dialog v-model="notifyDialogOpen">
        <q-card class="sucess-add-to-collection">
          <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
            notifyDialogTitle
          }}</q-card-section>
          <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
            notifyDialogMessage
          }}</q-card-section>
          <q-card-actions>
            <q-btn flat label="Close" class="btn-save" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>

    <footer class="login-footer desktop-content">
      <div class="footer-content">
        <p class="footer-text">
          By using this service, you agree to the PUP Online Services
          <a
            href="https://www.pup.edu.ph/terms/"
            class="footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Use
          </a>
          and
          <a
            href="https://www.pup.edu.ph/privacy/"
            class="footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy
          </a>
        </p>
        <p class="copyright">
          © 2025 Polytechnic University of the Philippines. All rights reserved.
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'
import MobileNotSupported from 'src/components/MobileNotSupported.vue'

const $q = useQuasar()
const router = useRouter()
const userStore = useUserStore()

const form = ref({
  email: '',
  password: '',
})

const showPassword = ref(false)

const message = ref('')
const messageType = ref('')
const loginAttempts = ref(0)
const cooldownActive = ref(false)
const cooldownTime = ref(0)
const maxAttempts = 3
const remainingAttempts = computed(() => maxAttempts - loginAttempts.value)
let cooldownInterval = null

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

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
      showNotifyDialog('Login Error', 'Unable to verify user. Please try again.')
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
        showNotifyDialog(
          'Registration Error',
          'Unable to verify registration status. Please try again.',
        )
        return
      }

      if (visitorRegistration) {
        if (visitorRegistration.status === 'Pending') {
          showNotifyDialog(
            'Registration Pending',
            'Please wait for the admin to evaluate your registration.',
          )
        } else if (visitorRegistration.status === 'Rejected') {
          showNotifyDialog('Registration Rejected', 'Sorry. Your registration has been rejected.')
        }
      } else {
        showNotifyDialog('Account Not Found', 'No account found with this email.')
      }
      return // Do not proceed to login
    }

    // Check email verification for students, faculty, and admins
    if (
      profile.user_type === 'student' ||
      profile.user_type === 'faculty' ||
      profile.user_type === 'admin' ||
      profile.user_type === 'super admin'
    ) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(profile.id)

      if (authError) {
        console.error('Auth user lookup failed:', authError.message)
        showNotifyDialog('Verification Error', 'Unable to verify email status. Please try again.')
        return
      }

      if (!authUser.user?.email_confirmed_at) {
        showNotifyDialog(
          'Email Verification Required',
          'Please check your email for account authentication first before logging in.',
        )
        clearForm()
        return
      }
    }

    // If visitor, check status before signing in
    if (profile.user_type === 'visitor') {
      const { data: visitorStatus, error: visitorError } = await supabase
        .from('approved_visitors_status')
        .select('account_status')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (visitorError) {
        console.error('Visitor status lookup failed:', visitorError.message)
        showNotifyDialog(
          'Visitor Status Error',
          'Unable to verify visitor status. Please try again.',
        )
        return
      }

      const accountStatus = visitorStatus?.account_status

      // Allow Active and Inactive users to log in
      if (accountStatus !== 'Active' && accountStatus !== 'Inactive') {
        if (accountStatus === 'Expired') {
          showNotifyDialog('Access Expired', 'Your access has expired.')
        } else if (accountStatus === 'Not Started') {
          showNotifyDialog('Access Not Started', 'Your access date has not started yet.')
        } else if (accountStatus === 'Pending Confirmation') {
          showNotifyDialog(
            'Email Verification Required',
            'Please check your email for account authentication first and make sure to set a password.',
          )
        } else {
          showNotifyDialog('Access Denied', 'Access denied. Unknown visitor status.')
        }
        clearForm()
        return // Do not proceed to login
      }

      // Check if using temporary password
      const { data: visitorData, error: tempPassError } = await supabase
        .from('approved_visitors')
        .select('is_temp_password')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (tempPassError) {
        console.error('Temp password check failed:', tempPassError.message)
      }

      if (visitorData?.is_temp_password === true) {
        showNotifyDialog(
          'Password Reset Required',
          'Please check your confirmation email and set a new password before logging in. Alternatively, you may click the "Forgot Password" to set a new one.',
        )
        clearForm()
        return
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
      await userStore.signOut()
    }

    // Ensure Favorites collection exists, create if none 
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
    showNotifyDialog('Login Error', 'An unexpected error occurred. Please try again.')
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
/* ========================
 DESKTOP CONTENT TOGGLE
======================== */
.desktop-content {
  display: block;
}

@media (max-width: 48rem) {
  .desktop-content {
    display: none;
  }
}

:deep(.login-text-box .q-field__control::before),
:deep(.login-text-box .q-field__control::after) {
  display: none !important;
}

.sucess-add-to-collection {
  width: 25rem;
  height: 14rem;
  border-radius: 15px !important;
  background-color: #fbf4d0 !important;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.sub-font-3 {
  font-family: 'Poppins', sans-serif;
  color: #000000;
}

.btn-save {
  width: 5rem;
  height: 1rem;
  border-radius: 5px;
  background-color: #880000;
  color: #fbf4d0;
  font-size: 12px;
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
}

.login-footer {
  color: #7c7c7c;
  padding: 1.5rem 2rem;
  margin-top: 1rem;
}
</style>
