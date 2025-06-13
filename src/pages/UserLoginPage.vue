<template>
  <div class="q-pa-md form-container">
    <div class="column items-center q-mb-md">
      <label class="form-title">LOG IN</label>
      <label class="subtitle">Access Your Account</label>
    </div>
    <q-form @submit.prevent="loginUser">
      <div class="column q-gutter-sm">
        <label class="names">Email</label>
        <q-input
          filled
          v-model="form.email"
          type="email"
          lazy-rules
          :rules="[
            (val) => !!val || 'Please enter your email.',
            (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Use your PUP email only.',
          ]"
          class="login-text-box"
        />
        <label class="names">Password</label>
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
        <a href="/forgot-password" class="forgot-password-link">Forgot Password</a>
      </div>
      <div class="column items-center q-pt-md">
        <q-btn label="Log In" type="submit" class="log-in" />
      </div>
      <div class="column items-center q-mb-md">
        <label class="already">
          Don't have an account?
          <router-link to="/user/register" name="user-register" class="signup-login-link"
            >Sign Up</router-link
          >
        </label>
      </div>
    </q-form>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        email: '',
        password: '',
        showPassword: false,
      },
    }
  },

  methods: {
    // Login user
    async loginUser() {
      try {
        const response = await fetch('http://localhost:3000/login-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || 'Login failed.')
        } else {
          alert('Login successful!')
          console.log(data)
          this.$router.push('/home')
        }
      } catch (error) {
        alert('An error occurred during login.')
        console.error(error)
      }
    },
  },
}
</script>
