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
            filled
            dense
            v-model="form.email"
            type="email"
            lazy-rules
            :rules="[
              (val) => !!val || 'Please enter your email.',
              (val) =>
                val.includes('@iskolarngbayan.pup.edu.ph') || 'Please use your PUP email only.',
              checkEmailUnique,
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
              <img src="/icons/arrow.png" alt="next" class="btn-icon" />
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
            <div class="col-5">
              <div class="column q-gutter-sm">
                <label class="labelNames">Department</label>
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
                <label class="labelNames">Year & Section</label>
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
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'

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

const collegeDepartment = {
  'College of Computer and Information Sciences': [
    'Bachelor of Science in Computer Science',
    'Bachelor of Science in Information Technology',
  ],
  'College of Social Sciences and Development': [
    'Bachelor of Arts in History',
    'Bachelor of Arts in Sociology',
    'Bachelor of Science in Cooperatives',
    'Bachelor of Science in Economics',
    'Bachelor of Science in Psychology',
  ],
  'College of Arts and Letters': [
    'Bachelor of Arts in English Language Studies',
    'Bachelor of Arts in Filipinology',
    'Bachelor of Arts in Literary and Cultural Studies',
    'Bachelor of Arts in Philosophy',
    'Bachelor of Performing Arts major in Theater Arts',
  ],
  'College of Education': [
    'Bachelor of Technology and Livelihood Education',
    'Bachelor of Library and Information Science',
    'Bachelor of Secondary Education',
    'Bachelor of Elementary Education',
    'Bachelor of Early Childhood Education',
  ],
  'College of Political Science and Public Administration': [
    'Bachelor of Public Administration',
    'Bachelor of Arts in International Studies',
    'Bachelor of Arts in Political Economy',
    'Bachelor of Arts in Political Science',
  ],
}

const departmentOptions = computed(() => {
  return collegeDepartment[form.value.college] || []
})

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
async function validateStepOne() {
  const { first_name, last_name, email, contact } = form.value

  if (!first_name || !last_name || !email || !contact) {
    alert('Please fill out all required fields.')
    return
  }

  if (!email.includes('@iskolarngbayan.pup.edu.ph')) {
    alert('Please use your PUP email only.')
    return
  }

  const emailUnique = await checkEmailUnique(email)
  if (emailUnique !== true) {
    alert(emailUnique)
    return
  }

  step.value++
}

// Check if email already exists in all_users table
const checkEmailUnique = async (val) => {
  if (!val) return true

  const { data, error } = await supabase
    .from('all_users')
    .select('id')
    .eq('email', val)
    .maybeSingle()

  if (error) {
    console.error(error)
    return true
  }

  return !data || 'An account with this email already exists. Please use a different email.'
}

// Register user
async function registerUser() {
  const {
    first_name,
    last_name,
    email,
    contact,
    college,
    department,
    year_section,
    is_alumni,
    password,
    confirmPassword,
  } = form.value

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
  if (!passwordRegex.test(password)) {
    alert(
      'Password must be at least 8 characters long and contain an uppercase letter, a number, and a special character.',
    )
    return
  }

  if (password !== confirmPassword) {
    alert('Passwords do not match!')
    return
  }

  if (!college || !department || !year_section) {
    alert('Please fill out all required fields.')
    return
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'user',
          type: 'student',
        },
        emailRedirectTo: 'http://localhost:9000/user/login',
      },
    })

    if (error) {
      alert(error.message)
      return
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('registered_users').insert([
        {
          id: data.user.id,
          first_name,
          last_name,
          email,
          contact,
          college,
          department,
          year_section,
          is_alumni,
          created_at: new Date(),
        },
      ])

      if (profileError) {
        console.error(profileError)
        alert('User created, but failed to save profile.')
        return
      }

      const { error: favoritesCollectionError } = await supabase.from('collections').insert([
        {
          collection_name: 'Favorites',
          description: 'Items you marked as favorite will appear here.',
          user_id: data.user.id,
          is_default: true,
          is_locked: true,
          created_at: new Date(),
          updated_at: new Date(),
          cover_url:
            'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers//favoritescover.png',
        },
      ])

      if (favoritesCollectionError) {
        console.error(favoritesCollectionError)
        alert('User created, but failed to create Favorites collection.')
        return
      }

      alert('Registration successful! Please check your email to confirm your account.')
      router.push('/user/login')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    alert('An unexpected error occurred.')
  }
}
</script>
