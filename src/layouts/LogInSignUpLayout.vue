<template>
  <div class="page-background" style="background-color: #4d0000">
    <div class="row">
      <div class="col-6 flex">
        <q-img src="src/assets/img/pup-glows.png" alt="PUP Glow" class="bg-glow" />
      </div>
      <div class="col-6 q-py-xl login-card-style flex flex-center">
        <q-page-container>
          <!-- <router-view /> -->
          <q-page class="flex flex-center">
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
          </q-page>
        </q-page-container>
      </div>
    </div>
  </div>
</template>
<style scoped>
.page-background {
  background-image:
    linear-gradient(0deg, rgba(86, 5, 5, 0.7) 50.47%, rgba(0, 0, 0, 0.56) 95.19%),
    url('src/assets/img/pup-bg.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  min-height: 100vh;
}

.bg-glow {
  width: 70rem;
  height: auto;
  position: absolute;
  bottom: 0px;

  left: -5.5rem;
}

.login-card-style {
  min-height: 100vh;

  position: relative;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  background: linear-gradient(
    334deg,
    #fffce9 6.65%,
    #fffefa 29.43%,
    #fff 7.69%,
    #fffef6 90.7%,
    #fffced 105.52%
  );
  box-shadow: -20px 15px 4px 0px rgba(0, 0, 0, 0.45);
  overflow: hidden;
}
</style>
