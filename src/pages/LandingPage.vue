<!--USER LANDING PAGE-->
<template>
  <div class="page-background">
    <div class="page-header q-pa-md">
      <q-toolbar class="toolbar">
        <q-space />

        <div class="flex flex-center">
          <q-img
            src="/img/logo.png"
            alt="Logo"
            style="width: 70px; height: 70px; flex-shrink: 0; aspect-ratio: 1/1; left: 100%"
            class="q-px-auto q-mt-sm"
          />
        </div>
        <q-space />
        <!-- Buttons -->
        <q-btn
          flat
          label="Sign Up"
          style="color: #fbf4d0"
          class="btn"
          @click="$router.push('/user/register-option')"
        />
        <q-btn
          flat
          label="Log In"
          style="color: #fbf4d0"
          class="btn"
          @click="$router.push('/user/login')"
        />
      </q-toolbar>
      <!-- Text -->
      <div class="main-content" style="position: relative">
        <div class="q-ma-xl" style="padding-left: 30px">
          <h4 class="text-secondary text-weight-bold q-mb-none" style="letter-spacing: 0.75px">
            Preserving History.<br />
            Empower Discovery.
          </h4>
          <p
            style="color: #fff6c1; letter-spacing: 0.75px; font-size: 14px; font-weight: 300"
            class="q-mt-md"
          >
            Step into PUP's past through 3D-modeled artifacts and<br />
            scanned documents built to stand the test of time.
          </p>
        </div>
        <!-- Images -->
        <q-img
          src="/img/C-trophy.png"
          alt="C Trophy"
          style="
            width: 670px;
            height: auto;
            position: absolute;
            bottom: -300px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1;
            object-fit: contain;
          "
          class="q-px-auto"
        />

        <q-img
          src="/img/L-trophy.png"
          alt="L Trophy"
          style="
            width: 325px;
            height: auto;
            position: absolute;
            bottom: -310px;
            right: 1000px;
            z-index: 1;
            object-fit: contain;
          "
          class="q-px-auto"
        />

        <q-img
          src="/img/R-trophy.png"
          alt="R Trophy"
          style="
            width: 380px; /* Adjust width as needed */
            height: auto; /* Let height adjust proportionally */
            position: absolute;
            bottom: -300px; /* Adjust this value to move it up or down */
            left: 1000px; /* Adjust this value to move it left or right */
            z-index: 1; /* Ensure it overlaps text if needed */
            object-fit: contain;
          "
          class="q-px-auto"
        />
        <div class="q-pa-md"></div>
      </div>
    </div>
    <div class="bottom-shadow-overlay"></div>

    <div class="main-tile">
      <div class="q-pa-md">
        <h1 class="font-benne text-tertiary text-center" style="letter-spacing: 5px">
          PRESERV<span class="text-secondary">3D</span>
        </h1>
      </div>
    </div>
  </div>
</template>

<script setup>
//
</script>

<style scoped>
.page-background {
  background:
    linear-gradient(0deg, rgba(63, 4, 4, 0.8) 70%, rgba(0, 0, 0, 0.9) 99%), url('/img/bg-img.png');
  background-size: cover;
  background-position: center center;
  background-repeat: no-repeat;
  min-height: 100vh;
}

.bottom-shadow-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 350px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 20%, transparent 100%);
  z-index: 50;
  pointer-events: none;
}

@font-face {
  font-family: 'Benne';
  src: url(src/assets/fonts/Benne.ttf) format('truetype');
}

.font-benne {
  font-family: 'Benne', sans-serif;
  text-shadow: 70px 30px 4px rgba(0, 0, 0, 0.55);
}

.main-tile {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 15px;
  z-index: 100;
  width: 100%;
  text-align: center;
}
</style>
