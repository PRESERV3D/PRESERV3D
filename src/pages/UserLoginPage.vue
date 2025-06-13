<template>
  <div class="flex flex-center">
    <q-form @submit.prevent="loginUser">
      <p>Email</p>
      <q-input
        filled
        v-model="form.email"
        type="email"
        lazy-rules
        :rules="[
          (val) => !!val || 'Please enter your email.',
          (val) => val.includes('@iskolarngbayan.pup.edu.ph') || 'Use your PUP email only.',
        ]"
      />
      <p>Password</p>
      <q-input
        filled
        v-model="form.password"
        type="password"
        lazy-rules
        :rules="[(val) => !!val || 'Please enter your password.']"
      />
      <q-btn label="Login" type="submit" color="primary" />
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
