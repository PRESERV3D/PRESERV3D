<template>
  <q-layout view="lHh Lpr lFf">
    <div
      class="page-background"
      style="background-color: #4d0000; display: flex; justify-content: center; align-items: center"
    >
      <div class="forgot-bigbox">
        <div class="pad q-my-lg column">
          <label class="reset-title q-mb-sm">Forgot Password</label>
          <div class="row q-gutter-md items-center justify-center">
            <label class="labelNames">Email: </label>
            <q-input
              filled
              v-model="email"
              placeholder="isko@iskolarngbayan.pup.edu.ph"
              type="email"
              lazy-rules
              :rules="[
                (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Please enter a valid email.',
              ]"
              dense
              class="text-box-2"
              style="width: 30rem; margin-top: 2rem"
            />
          </div>
          <div class="submit-center">
            <div v-if="!isSubmitLoading">
              <q-btn
                :disabled="!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)"
                label="Submit"
                class="btn-submit"
                @click="sendResetEmail()"
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

          <q-dialog v-model="showDialog" persistent>
            <q-card class="reset-pass-sent">
              <q-card-section class="column items-center">
                <div class="q-mt-md sub-font-2" style="color: #000000">
                  {{ message }}
                </div>
              </q-card-section>
              <q-card-actions align="center">
                <q-btn label="Confirm" class="btn-save" flat @click="handleDialogConfirm" />
                <!-- add logic that must go back to log in (respective log in page: admin/user)-->
              </q-card-actions>
            </q-card>
          </q-dialog>
        </div>
      </div>
    </div>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from 'boot/supabase'
import { useRouter } from 'vue-router'

const router = useRouter()
const email = ref('')
const message = ref('')
const showDialog = ref(false)
const emailSent = ref(false)
const isSubmitLoading = ref(false)
// Check if email exists
async function checkEmail() {
  const { data, error } = await supabase
    .from('all_users')
    .select('email')
    .eq('email', email.value)
    .single()

  if (error) {
    console.error('Error checking email:', error.message)
    return false
  }
  return data ? true : false
}

async function sendResetEmail() {
  isSubmitLoading.value = true
  const emailExists = await checkEmail()
  if (!emailExists) {
    message.value = 'Email not found.'
    showDialog.value = true
    isSubmitLoading.value = false
    return
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.value, {
    redirectTo: 'http://localhost:9000/resetpassword',
  })

  if (error) {
    message.value = error.message
    emailSent.value = false
  } else {
    message.value =
      'A password reset email has been sent to your registered email address. Please check your inbox.'
    emailSent.value = true
  }
  isSubmitLoading.value = false
  showDialog.value = true
}

function handleDialogConfirm() {
  showDialog.value = false
  if (emailSent.value) {
    router.push('/user/login')
  }
}
</script>

<style scoped>
.forgot-bigbox {
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
  width: 32rem;
  padding: 1rem;
  text-align: center;
}

:deep(.text-box-2 .q-field__control::before),
:deep(.text-box-2 .q-field__control::after) {
  display: none;
}
</style>
