<template>
  <div class="q-pa-md form-container">
    <div class="column items-center">
      <label class="form-title">SIGN UP</label>
      <label class="subtitle-logsign">Let's Get You Set Up</label>
    </div>

    <q-form @submit.prevent="registerUser">
      <div v-if="step === 1">
        <div class="column q-gutter-sm">
          <label class="labelNames">First Name</label>
          <q-input
            dense
            v-model="form.first_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your first name.']"
            class="text-box"
          />
          <label class="labelNames">Last Name</label>
          <q-input
            dense
            v-model="form.last_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your last name.']"
            class="text-box"
          />
          <label class="labelNames">Email</label>
          <q-input
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
          <label class="labelNames">Contact Number</label>
          <q-input
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
          <label class="labelNames">College</label>
          <q-select
            dense
            v-model="form.college"
            :options="Object.keys(collegeDepartment)"
            lazy-rules
            :rules="[(val) => !!val || 'Please select your college.']"
            class="text-box"
            @update:model-value="form.department = ''"
          />

          <div class="row items-center">
            <div class="column q-gutter-sm">
              <label class="labelNames">Department</label>
              <q-select
                dense
                v-model="form.department"
                :options="departmentOptions"
                lazy-rules
                :rules="[(val) => !!val || 'Please select your department.']"
                class="text-box"
              />
            </div>
          </div>

          <label class="labelNames">Password</label>
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
          <label class="labelNames">Confirm Password</label>
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

        <div class="column items-center">
          <a @click="step--" class="labelNames cursor-pointer q-mb-sm">Back</a>
          <q-btn
            class="sign-up"
            push
            color="primary"
            text-color="white"
            label="SIGN UP"
            @click="registerUser"
          />
        </div>

        <div class="column items-center q-mt-sm">
          <label class="already">
            Already have an account?
            <a href="/user/login" class="signup-login-link">Log In</a>
          </label>
        </div>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// Step state for form navigation
const step = ref(1)

// Example form object (add your actual form fields as needed)
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

// Example collegeDepartment object (replace with your actual data)
const collegeDepartment = ref({
  'College of Science': ['Department of Math', 'Department of Physics'],
  'College of Engineering': [
    'Department of Civil Engineering',
    'Department of Mechanical Engineering',
  ],
})

// Computed department options based on selected college
const departmentOptions = computed(() => {
  return collegeDepartment.value[form.value.college] || []
})

// Example password strength logic (replace with your actual logic)
const passwordStrength = computed(() => {
  if (form.value.password.length >= 8) return 'Strong'
  if (form.value.password.length > 0) return 'Weak'
  return ''
})
const passwordStrengthColor = computed(() => {
  if (form.value.password.length >= 8) return 'green'
  if (form.value.password.length > 0) return 'red'
  return ''
})

// Example validateStepOne function (implement your actual validation logic)
function validateStepOne() {
  // Add your validation logic here
  step.value = 2
}

// Example registerUser function (implement your actual registration logic)
function registerUser() {
  // Add your registration logic here
}
</script>
