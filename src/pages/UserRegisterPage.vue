<template>
  <div class="q-pa-md form-container">
    <div class="column items-center q-mb-md">
      <label class="form-title">SIGN UP</label>
      <label class="subtitle">Let's Get You Set Up</label>
    </div>

    <q-form @submit.prevent="registerUser">
      <div v-if="step === 1">
        <div class="column q-gutter-sm">
          <label class="names">First Name</label>
          <q-input
            filled
            dense
            v-model="form.first_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your first name.']"
            class="text-box"
          />
          <label class="names">Last Name</label>
          <q-input
            filled
            dense
            v-model="form.last_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your last name.']"
            class="text-box"
          />
          <label class="names">Email</label>
          <q-input
            filled
            dense
            v-model="form.email"
            type="email"
            lazy-rules
            :rules="[
              (val) => !!val || 'Please enter your email.',
              (val) =>
                val.includes('@iskolarngbayan.pup.edu.ph') || 'Please use your PUP email only.',
            ]"
            class="text-box"
          />
          <label class="names">Contact Number</label>
          <q-input
            filled
            dense
            v-model="form.contact"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your contact number.']"
            class="text-box"
          />
          <div class="column items-center q-mt-xs">
            <q-btn
              class="next-button"
              push
              color="primary"
              text-color="white"
              @click="validateStepOne"
            >
              <img src="icons/arrow.png" alt="next" class="btn-icon" />
            </q-btn>
          </div>

          <div class="column items-center q-mb-xs">
            <label class="already">
              Already have an account?
              <router-link to="/user/login" name="user-login" class="signup-login-link"
                >Log In</router-link
              >
            </label>
          </div>
        </div>
      </div>

      <div v-if="step === 2">
        <div class="column q-gutter-sm">
          <label class="names">College</label>
          <q-select
            dense
            v-model="form.college"
            :options="collegeOptions"
            lazy-rules
            :rules="[(val) => !!val || 'Please select your college.']"
            class="text-box"
          />

          <div class="row items-center">
            <div class="col-5">
              <div class="column q-gutter-sm">
                <label class="names">Department</label>
                <q-select
                  dense
                  v-model="form.department"
                  :options="departmentOptions"
                  lazy-rules
                  :rules="[(val) => !!val || 'Please select your department.']"
                  class="c-textbox"
                />
              </div>
            </div>

            <div class="col-5">
              <div class="column q-gutter-sm">
                <label class="names">Year & Section</label>
                <q-input
                  dense
                  v-model="form.year_section"
                  lazy-rules
                  :rules="[(val) => !!val || 'Please enter your year and section.']"
                  class="c-textbox"
                />
              </div>
            </div>

            <div class="col q-pt-xs">
              <q-checkbox v-model="form.is_alumni" dense label="Alumni" class="c-textbox" />
            </div>
          </div>

          <label class="names">Password</label>
          <q-input
            dense
            v-model="form.password"
            type="password"
            :hint="passwordStrength"
            :color="passwordStrengthColor"
            lazy-rules
            :rules="[
              (val) => !!val || 'Please enter your password.',
              (val) => val.length >= 8 || 'Must be at least 8 characters long.',
              (val) =>
                (/[A-Z]/.test(val) && /[0-9]/.test(val) && /[^a-zA-Z0-9]/.test(val)) ||
                'Must contain an uppercase letter, a number, and a special character.',
            ]"
            class="text-box"
          />
          <label class="names">Confirm Password</label>
          <q-input
            dense
            v-model="form.confirmPassword"
            type="password"
            lazy-rules
            :rules="[
              (val) => !!val || 'Please confirm your password.',
              (val) => val === form.password || 'Passwords do not match.',
            ]"
            class="text-box"
          />
        </div>

        <q-btn label="Back" @click="step--" color="secondary" />
        <q-btn label="Register" @click="registerUser" color="primary" />
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const step = ref(1)

const form = ref({
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
})

const collegeOptions = [
  'College of Computer and Information Sciences',
  'College of History',
  'College of Arts and Sciences',
]

const departmentOptions = ['Information Technology', 'Computer Science', 'Social Sciences']

// Password strength status
const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return ''

  const hasUpper = /[A-Z]/.test(pwd)
  const hasNumber = /[0-9]/.test(pwd)
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd)
  const isLongEnough = pwd.length >= 8

  return hasUpper && hasNumber && hasSpecial && isLongEnough ? 'Strong' : 'Weak'
})

const passwordStrengthColor = computed(() =>
  passwordStrength.value === 'Strong' ? 'green' : 'red',
)

// Validate step one inputs
function validateStepOne() {
  const { first_name, last_name, email, contact } = form.value

  const isValidEmail = email && email.includes('@iskolarngbayan.pup.edu.ph')

  if (!first_name || !last_name || !email || !contact) {
    alert('Please fill out all required fields.')
    return
  }

  if (!isValidEmail) {
    alert('Please use your PUP email only.')
    return
  }

  // Go to step two if all checks pass
  step.value++
}

// Register user
async function registerUser() {
  const { college, department, year_section, password, confirmPassword } = form.value

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
      body: JSON.stringify(form.value),
    })

    const data = await response.json()

    if (!response.ok) {
      alert(data.error || 'Registration failed.')
    } else {
      alert('Registration successful!')
      console.log(data)
      router.push('/user-login')
    }
  } catch (error) {
    alert('An error occurred.')
    console.error(error)
  }
}
</script>
