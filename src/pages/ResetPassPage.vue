<template>
  <q-layout view="lHh Lpr lFf">
    <div
      class="page-background"
      style="background-color: #4d0000; display: flex; justify-content: center; align-items: center"
    >
      <div class="reset-bigbox">
        <div class="q-my-lg column">
          <label class="reset-title q-mb-md">Reset password</label>
          <div class="q-ml-xl">
            <div class="row q-gutter-md items-center">
              <!-- New password input -->
              <label class="labelNames">New Password: </label>
              <q-input
                v-model="newPassword"
                filled
                dense
                :type="showPassword ? 'text' : 'password'"
                class="text-box-2"
                style="width: 23rem; margin-left: 2.6rem"
              >
                <template v-slot:append>
                  <q-icon
                    :name="showPassword ? 'visibility' : 'visibility_off'"
                    class="cursor-pointer"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </q-input>

              <!-- Confirm password input -->
              <label class="labelNames">Confirm Password: </label>
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
          </div>
          <div class="row justify-center q-mt-lg">
            <q-btn
              label="Submit"
              class="btn-submit"
              @click="((resetSent = true), resetPassword())"
              no-caps
            />
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

onMounted(() => {
  const hash = window.location.hash
  const params = new URLSearchParams(hash.replace('#', ''))

  if (params.get('error_code') === 'otp_expired') {
    message.value = 'Your password reset link has expired. Please request a new one.'
    resetSuccess.value = true
    resetSent.value = true
  }
})

function checkPasswordMatch() {
  if (newPassword.value !== confirmPassword.value) {
    message.value = 'Passwords do not match.'
    return false
  }
  return true
}

// Supabase will auto-login user if they came via reset email
async function resetPassword() {
  if (!checkPasswordMatch()) {
    resetSent.value = true
    return
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword.value,
  })

  if (error) {
    message.value = error.message
    resetSuccess.value = false
  } else {
    message.value = 'Password has been reset.'
    resetSuccess.value = true
  }

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
  width: 38rem;
  height: 16.5rem;
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
</style>
