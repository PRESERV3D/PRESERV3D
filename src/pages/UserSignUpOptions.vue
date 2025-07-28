<template>
  <div class="q-pa-md form-container">
    <div class="column items-center q-mb-md">
      <label class="form-title">SIGN UP</label>
      <label class="subtitle-logsign">Choose Role</label>
      <div class="column q-gutter-lg q-mt-md">
        <q-btn label="PUP Student" class="roles-box" no-caps @click="goToStudentRegister" />
        <q-btn label="PUP Faculty" class="roles-box" no-caps @click="goToFacultyRegister" />
        <q-btn
          label="Visitor"
          class="roles-box"
          style="background-color: #ccac00; color: #560505"
          no-caps
          @click="goToVisitorRegister"
        />
      </div>
    </div>

    <!-- Back to Log In link, now placed outside and anchored to bottom-right -->
    <router-link to="/user/login" class="login-back-font fixed-bottom-right">
      Back to Log In
    </router-link>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

function goToStudentRegister() {
  router.push('/user/register')
}
function goToFacultyRegister() {
  router.push('/user/faculty')
}
function goToVisitorRegister() {
  router.push('/user/visitor')
}
</script>

<style scoped>
.roles-box {
  font-family: 'Poppins', sans-serif;
  font-weight: 600;
  font-size: 20px;
  color: #ffffff;
  background-color: #560505;
  padding: 1rem;
  width: 18rem;
  border-radius: 15px;
  box-shadow: 0 10px 4px rgba(0, 0, 0, 0.2);
}

.login-back-font {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 16px;
  color: #000000;
  text-decoration: none;
}

.fixed-bottom-right {
  position: fixed;
  bottom: 3rem;
  right: 5rem;
}
</style>
