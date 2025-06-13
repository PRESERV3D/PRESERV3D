<template>
  <div class="page-background">
    <div class="row">
      <div class="col-6 flex">
        <q-img
          src="icons/pup-glows.png"
          alt="PUP Glow"
          style="
            width: 1000px;
            height: auto;
            position: absolute;
            bottom: 0px;
            right: 610px;
            z-index: 1;
            object-fit: contain;
          "
          class="q-px-auto"
        />
      </div>
      <div class="col-6 q-py-xl light-bg login-card-style flex flex-center">
        <div class="q-pa-md form-container" style="max-width: 600px">
          <div class="column items-center q-mb-md">
            <label class="form-title">LOG IN</label>
            <label class="subtitle">Access Your Account</label>
          </div>

          <q-form ref="formRef" @submit="handleSubmit">
            <div class="column items-center">
              <div class="column q-gutter-md q-pa-sm">
                <label class="names">Email</label>
                <q-input
                  v-model="email"
                  outlined
                  dense
                  :rules="[isRequired, isValidEmail]"
                  class="text-box"
                  type="email"
                />

                <label class="names">Password</label>
                <q-input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  outlined
                  dense
                  :rules="[isRequired]"
                  class="text-box"
                >
                  <template v-slot:append>
                    <q-icon
                      :name="showPassword ? 'visibility' : 'visibility_off'"
                      class="cursor-pointer"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </q-input>
                <div class="text-right full-width no-gutter-top">
                  <a href="/forgot-password" class="forgot-password-link">Forgot Password</a>
                </div>
              </div>
            </div>

            <div class="column items-center q-pt-md">
              <q-btn label="Log In" type="submit" class="log-in" />
            </div>

            <div class="column items-center q-mb-md">
              <label class="already">
                Don't have an account?
                <a href="/signup" class="signup-link">Sign Up</a>
              </label>
            </div>
          </q-form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const formRef = ref(null)

function isRequired(val) {
  return !!val || 'Field is required'
}

function isValidEmail(val) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailPattern.test(val) || 'Please enter a valid email address'
}

function handleSubmit() {
  formRef.value.validate().then((valid) => {
    if (valid) {
      console.log('Log in submitted:', { email: email.value, password: password.value })
      router.push('/dashboard')
    } else {
      console.log('Validation failed')
    }
  })
}
</script>
