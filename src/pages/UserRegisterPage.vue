<template>
  <div class="q-pa-md form-container">
    <div class="column items-center q-mb-lg">
      <label class="form-title">STUDENT SIGN UP</label>
      <label class="subtitle-logsign">Let's Get You Set Up</label>
    </div>

    <q-form @submit.prevent="registerUser">
      <div v-if="step === 1">
        <div class="column q-gutter-sm q-mt-md">
          <label class="labelNames">First Name <span class="required">*</span></label>
          <q-input
            dense
            v-model="form.first_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your first name.']"
            class="text-box"
          />
          <label class="labelNames">Last Name <span class="required">*</span></label>
          <q-input
            dense
            v-model="form.last_name"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your last name.']"
            class="text-box"
          />
          <label class="labelNames">Email <span class="required">*</span></label>
          <q-input
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

          <!-- <label class="labelNames">Contact Number</label>
          <q-input
            dense
            v-model="form.contact"
            lazy-rules
            :rules="[(val) => !!val || 'Please enter your contact number.']"
            class="text-box"
          /> -->
          <label class="labelNames">College <span class="required">*</span></label>
          <q-select
            dense
            v-model="form.college"
            :options="Object.keys(collegeDepartment)"
            lazy-rules
            :rules="[(val) => !!val || 'Please select your college.']"
            class="text-box"
            @update:model-value="form.department = ''"
          />

          <div class="column items-center q-mt-md">
            <q-btn
              class="next-button"
              push
              color="primary"
              text-color="white"
              @click="validateStepOne"
            >
              <img src="/icons/arrow.png" alt="next" class="btn-icon" />
            </q-btn>
            <div class="q-mt-md">
              <router-link to="/user/register-option" class="signup-options q-mt-sm">
                Back to Sign Up Options
              </router-link>
            </div>
          </div>

          <div class="column items-center">
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
          <div class="row items-center">
            <div class="col-5">
              <div class="column q-gutter-sm">
                <label class="labelNames">Department <span class="required">*</span></label>
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
                <label class="labelNames">Year & Section <span class="required">*</span></label>
                <q-input
                  dense
                  v-model="form.year_section"
                  lazy-rules
                  :disable="form.is_alumni"
                  :rules="[(val) => !!val || 'Please enter your year and section.']"
                  class="c-textbox"
                />
              </div>
            </div>

            <div class="col labelNames q-pt-xs">
              <q-checkbox v-model="form.is_alumni" dense label="Alumni" class="c-textbox" />
            </div>
          </div>

          <label class="labelNames">Password <span class="required">*</span></label>
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
          <label class="labelNames">Confirm Password <span class="required">*</span></label>
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
          <!--Terms and Conditions Checkbox -->
          <div class="row items-center q-mb-md">
            <q-checkbox v-model="acceptedterms" dense label="" class="terms-checkbox" />
            <div class="terms-font q-ml-sm">
              I understand and agree to the PUP Online Services
              <a
                href="https://www.pup.edu.ph/terms/"
                target="_blank"
                class="terms-font"
                style="text-decoration: underline; color: #560505"
              >
                Terms of Use
              </a>
              and
              <a
                href="https://www.pup.edu.ph/privacy/"
                target="_blank"
                class="terms-font"
                style="text-decoration: underline; color: #560505"
              >
                Privacy Policy
              </a>
            </div>
          </div>
        </div>

        <div class="column items-center">
          <a @click="step--" class="labelNames cursor-pointer q-mb-sm">Back</a>
          <q-btn
            :disable="!acceptedterms"
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

  <!-- Message Dialog -->
  <q-dialog v-model="notifyDialogOpen">
    <q-card class="sucess-add-to-collection">
      <q-card-section class="sub-font-3" style="font-size: 20px; font-weight: 700">{{
        notifyDialogTitle
      }}</q-card-section>
      <q-card-section class="sub-font-3" style="font-size: 14px; font-weight: 400">{{
        notifyDialogMessage
      }}</q-card-section>
      <q-card-actions>
        <q-btn flat label="Okay" class="btn-save" v-close-popup @click="handleNotifyDialogClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'

const router = useRouter()
const step = ref(1)

const form = ref({
  first_name: '',
  last_name: '',
  email: '',
  // contact: '',
  college: '',
  department: '',
  year_section: '',
  is_alumni: false,
  password: '',
  confirmPassword: '',
})

// Clear year_section when is_alumni is checked
watch(
  () => form.value.is_alumni,
  (newValue) => {
    if (newValue) {
      form.value.year_section = ''
    }
  },
)

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
  const { first_name, last_name, email, college } = form.value //remove contact here

  if (!first_name || !last_name || !email || !college) {
    //remove contact here
    showNotifyDialog('Missing Information', 'Please fill out all required fields.')
    return
  }

  if (!email.includes('@iskolarngbayan.pup.edu.ph')) {
    showNotifyDialog('Invalid Email', 'Please use your PUP email only.')
    return
  }

  const emailUnique = await checkEmailUnique(email)
  if (emailUnique !== true) {
    return
  }

  step.value++
}

// Check if email already exists in all_users table
const checkEmailUnique = async (val) => {
  if (!val) return true

  try {
    const { data: existingUser, error: userError } = await supabase
      .from('all_users')
      .select('id')
      .eq('email', val)
      .maybeSingle()

    if (userError && userError.code !== 'PGRST116') {
      console.error('Error checking all_users:', userError)
      return true
    }

    if (existingUser) {
      showNotifyDialog(
        'Account Already Exists',
        'An account with this email already exists. If this is you, please log in instead. Otherwise, please use a different email.',
      )
      return false
    }

    // Email is unique and available
    return true
  } catch (error) {
    console.error('Error in checkEmailUnique:', error)
    return true
  }
}

// Register user
async function registerUser() {
  const {
    first_name,
    last_name,
    email,
    // contact,
    college,
    department,
    year_section,
    is_alumni,
    password,
    confirmPassword,
  } = form.value

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/
  if (!passwordRegex.test(password)) {
    showNotifyDialog(
      'Invalid Password',
      'Password must be at least 8 characters long and contain an uppercase letter, a number, and a special character.',
    )
    return
  }

  if (password !== confirmPassword) {
    showNotifyDialog('Password Mismatch', 'Passwords do not match!')
    return
  }

  if (!college || !department || !year_section) {
    showNotifyDialog('Missing Information', 'Please fill out all required fields.')
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
      showNotifyDialog('Registration Error', error.message)
      return
    }

    const now = new Date()

    if (data.user) {
      const { error: profileError } = await supabase.from('registered_users').insert([
        {
          id: data.user.id,
          first_name,
          last_name,
          email,
          // contact,
          college,
          department,
          year_section,
          is_alumni,
          created_at: now,
        },
      ])

      if (profileError) {
        console.error(profileError)
        showNotifyDialog('Profile Error', 'User created, but failed to save profile.')
        return
      }

      const { error: allUserError } = await supabase.from('all_users').insert([
        {
          id: data.user.id,
          email,
          created_at: now,
          user_type: 'student',
        },
      ])

      if (allUserError) {
        console.error('Error in adding user to all users table: ', allUserError)
        return
      }

      const { createFavorites, error: favoritesError } = await createFavoritesCollection(
        data.user.id,
      )

      if (!createFavorites) {
        console.error('Error in creating Favorites collection: ', favoritesError)
        showNotifyDialog(
          'Collection Error',
          'User created, but failed to create Favorites collection.',
        )
        return
      }

      await showNotifyDialog(
        'Success',
        'Registration successful! Please check your email to authenticate your account.',
      )
      router.push('/user/login')
    }
  } catch (err) {
    console.error('Unexpected error:', err)
    showNotifyDialog('Error', 'An unexpected error occurred.')
  }
}

async function createFavoritesCollection(userId) {
  try {
    const { error } = await supabase.from('collections').insert([
      {
        collection_name: 'Favorites',
        description: 'Items you marked as favorite will appear here.',
        user_id: userId,
        is_default: true,
        is_locked: true,
        created_at: new Date(),
        // updated_at: now,
        cover_url:
          'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers/favoritescover.png',
      },
    ])

    if (error) {
      console.error('Error in creating Favorites collection: :', error)
      return { createFavorites: false, error }
    }

    return { createFavorites: true }
  } catch (err) {
    console.error('Unexpected error in creating Favorites collection:', err)
    return { success: false, error: err }
  }
}

// Notification dialog state
const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')
const dialogResolve = ref(null)

function showNotifyDialog(title, message) {
  return new Promise((resolve) => {
    notifyDialogTitle.value = title
    notifyDialogMessage.value = message
    notifyDialogOpen.value = true

    dialogResolve.value = resolve
  })
}

function handleNotifyDialogClose() {
  notifyDialogOpen.value = false
  if (dialogResolve.value) {
    dialogResolve.value()
    dialogResolve.value = null
  }
}
// Terms and Conditions checkbox state
const acceptedterms = ref(false)
</script>

<style scoped>
:deep(.text-box .q-field__control::before),
:deep(.text-box .q-field__control::after),
:deep(.c-textbox .q-field__control::before),
:deep(.c-textbox .q-field__control::after) {
  display: none !important;
}
</style>
