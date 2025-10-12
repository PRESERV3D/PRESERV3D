<template>
  <q-layout view="lHh Lpr lFf">
    <div
      class="page-background"
      style="background-color: #4d0000; display: flex; justify-content: center; align-items: center"
    >
      <div class="reset-bigbox">
        <div class="pad q-my-lg column">
          <label class="reset-title q-mb-md">Create New Password</label>
          <div class="row q-gutter-md items-center justify-between">
            <!-- New password input -->
            <label class="labelNames">New Password: <span class="required">*</span></label>
            <q-input
              v-model="newPassword"
              filled
              dense
              :type="showPassword ? 'text' : 'password'"
              class="text-box-2"
              style="width: 23rem"
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
          <div class="row q-gutter-md q-mt-sm q-mb-md items-center justify-between">
            <!-- Confirm password input -->
            <label class="labelNames">Confirm Password: <span class="required">*</span></label>
            <q-input
              v-model="confirmPassword"
              filled
              dense
              :type="showConfirmPassword ? 'text' : 'password'"
              class="text-box-2"
              style="width: 23rem"
            >
              <template v-slot:append>
                <q-icon
                  :name="showConfirmPassword ? 'visibility' : 'visibility_off'"
                  class="cursor-pointer"
                  @click="showConfirmPassword = !showConfirmPassword"
                />
              </template>
            </q-input>
          </div>

          <div class="submit-center">
            <div v-if="!isResetLoading">
              <q-btn
                :disable="isResetLoading || !newPassword || !confirmPassword"
                label="Submit"
                class="btn-submit"
                @click="((resetSent = true), resetPassword())"
                no-caps
              />
            </div>
            <q-spinner v-else color="primary" size="2em" class="q-mx-lg" />
            <div class="q-mt-sm">
              <router-link to="/user/login" class="labelNames" style="font-size: 12px">
                Back to Log In
              </router-link>
            </div>
          </div>

          <q-dialog v-model="resetSent" persistent>
            <q-card class="reset-pass-sent">
              <q-card-section class="column items-center">
                <div class="q-mt-md sub-font-2" style="color: #000000">
                  {{ message }}
                </div>
              </q-card-section>
              <q-card-actions align="center">
                <q-btn label="Confirm" class="btn-save" flat @click="handleDialogConfirm" />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
      </div>
    </div>
  </q-layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const message = ref('')
const resetSent = ref(false)
const resetSuccess = ref(false)
const isResetLoading = ref(false)

onMounted(() => {
  const hash = window.location.hash
  const params = new URLSearchParams(hash.replace('#', ''))

  if (params.get('error_code') === 'otp_expired') {
    message.value =
      'Your password reset link has expired. Please request a new password reset link from the forgot password page.'
    resetSuccess.value = false
    resetSent.value = true
  }
})

function checkPasswordMatch() {
  isResetLoading.value = true
  if (newPassword.value !== confirmPassword.value) {
    message.value = 'Passwords do not match. Please ensure both passwords are identical.'
    isResetLoading.value = false
    return false
  }
  return true
}

// Supabase will auto-login user if they came via reset email
async function resetPassword() {
  isResetLoading.value = true
  if (!checkPasswordMatch()) {
    // Use nextTick to ensure message is set before showing dialog
    await new Promise((resolve) => setTimeout(resolve, 0))
    resetSent.value = true
    return
  }

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    message.value =
      'Session expired or invalid. Please request a new password reset link from the forgot password page.'
    resetSuccess.value = false
    isResetLoading.value = false
    // Use nextTick to ensure message is set before showing dialog
    await new Promise((resolve) => setTimeout(resolve, 0))
    resetSent.value = true
    return
  }

  // Update password
  const { error } = await supabase.auth.updateUser({
    password: newPassword.value,
  })

  if (error) {
    message.value = `Failed to reset password: ${error.message}`
    resetSuccess.value = false
  } else {
    message.value = 'Password reset successful! You can now log in with your new password.'
    resetSuccess.value = true
    isResetLoading.value = false
  }

  // Update is_temp_password based on user role
  const role = user.user_metadata?.role

  if (role === 'admin') {
    const { error: adminError } = await supabase
      .from('registered_admins')
      .update({ is_temp_password: false })
      .eq('id', user.id)

    if (adminError) {
      console.error('Error updating admin temp password status:', adminError)
    }
  } else if (role === 'visitor') {
    const { error: visitorError } = await supabase
      .from('approved_visitors')
      .update({ is_temp_password: false })
      .eq('id', user.id)

    if (visitorError) {
      console.error('Error updating visitor temp password status:', visitorError)
    }
  }

  // Use nextTick to ensure message is set before showing dialog
  await new Promise((resolve) => setTimeout(resolve, 0))
  resetSent.value = true
}

function handleDialogConfirm() {
  resetSent.value = false
  if (resetSuccess.value) {
    router.push('/user/login')
  }
}
</script>

<style scoped>
.reset-bigbox {
  width: auto;
  height: auto;
  border-radius: 10px;
  background: linear-gradient(
    334deg,
    #fffce9 6.65%,
    #fffefa 29.43%,
    #fff 7.69%,
    #fffef6 90.7%,
    #fffced 105.52%
  );
  box-shadow: -20px 15px 4px 0px rgba(0, 0, 0, 0.45);
  padding: 1rem;
}

.reset-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 26px;
  color: #4d0000;
  text-align: center;
}

.btn-submit {
  width: 5rem;
  height: 2rem;
  border-radius: 5px;
  background-color: #880000;
  color: #ffffff;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
}

.reset-pass-sent {
  border-radius: 10px !important;
  background-color: #fbf4d0;
  width: 17rem;
  padding: 1rem;
  text-align: center;
}

:deep(.text-box-2 .q-field__control::before),
:deep(.text-box-2 .q-field__control::after) {
  display: none;
}
</style>
