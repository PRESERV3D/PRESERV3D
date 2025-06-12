<template>
  <q-page class="flex flex-center">
    <q-form @submit.prevent="registerUser">
      <div v-if="step === 1">
        <p>First Name</p>
        <q-input
          filled
          v-model="form.first_name"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your first name.']"
        />
        <p>Last Name</p>
        <q-input
          filled
          v-model="form.last_name"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your last name.']"
        />
        <p>Email</p>
        <q-input
          filled
          v-model="form.email"
          type="email"
          lazy-rules
          :rules="[
            (val) => !!val || 'Please enter your email.',
            (val) =>
              val.includes('@iskolarngbayan.pup.edu.ph') || 'Please use your PUP email only.',
          ]"
        />
        <p>Contact Number</p>
        <q-input
          filled
          v-model="form.contact"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your contact number.']"
        />
        <q-btn label=">" @click="validateStepOne" />
      </div>

      <div v-if="step === 2">
        <p>College</p>
        <q-select
          v-model="form.college"
          :options="collegeOptions"
          lazy-rules
          :rules="[(val) => !!val || 'Please select your college.']"
        />
        <p>Department</p>
        <q-select
          v-model="form.department"
          :options="departmentOptions"
          lazy-rules
          :rules="[(val) => !!val || 'Please select your department.']"
        />
        <p>Year & Section</p>
        <q-input
          filled
          v-model="form.year_section"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your year and section.']"
        />
        <q-checkbox v-model="form.is_alumni" label="Alumni" />
        <p>Password</p>
        <q-input
          v-model="form.password"
          type="password"
          lazy-rules
          :rules="[(val) => !!val || 'Please enter your password.']"
        />
        <p>Confirm Password</p>
        <q-input
          v-model="form.confirmPassword"
          type="password"
          lazy-rules
          :rules="[
            (val) => !!val || 'Please confirm your password.',
            (val) => val === form.password || 'Passwords do not match.',
          ]"
        />
        <q-btn label="Back" @click="step--" color="secondary" />
        <q-btn label="Register" @click="registerUser" color="primary" />
      </div>
    </q-form>
  </q-page>
</template>

<script>
export default {
  data() {
    return {
      step: 1,
      form: {
        first_name: '',
        last_name: '',
        email: '',
        contact: '',
        college: '',
        department: '',
        year_section: '',
        is_alumni: false,
        password: '',
        confirmPassword: '',
      },
      collegeOptions: [
        'College of Computer and Information Sciences',
        'College of History',
        'College of Arts and Sciences',
      ],
      departmentOptions: ['Information Technology', 'Computer Science', 'Social Sciences'],
    }
  },
  methods: {
    // Validate step one inputs
    validateStepOne() {
      const { first_name, last_name, email, contact } = this.form

      const isValidEmail = email && email.includes('@iskolarngbayan.pup.edu.ph')

      if (!first_name || !last_name || !email || !contact) {
        alert('Please fill out all required fields.')
        return
      }

      if (!isValidEmail) {
        alert('Please use your PUP email only.')
        return
      }

      // If all checks passed, go to next step
      this.step++
    },

    // Register user
    async registerUser() {
      const { college, department, year_section, password, confirmPassword } = this.form

      if (password !== confirmPassword) {
        alert('Passwords do not match!')
        return
      }

      if (!college || !department || !year_section || !password || !confirmPassword) {
        alert('Please fill out all required fields.')
        return
      }

      try {
        const response = await fetch('http://localhost:3000/register-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.form),
        })

        const data = await response.json()

        if (!response.ok) {
          alert(data.error || 'Registration failed.')
        } else {
          alert('Registration successful!')
          console.log(data)
          this.$router.push('/user-login')
        }
      } catch (error) {
        alert('An error occurred.')
        console.error(error)
      }
    },
  },
}
</script>
