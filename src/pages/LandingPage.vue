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
            class="logo-img q-px-auto q-mt-sm"
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
      <div class="main-content">
        <div class="content-text">
          <h4 class="text-secondary text-weight-bold q-mb-none hero-title">
            Preserving History.<br />
            Empower Discovery.
          </h4>
          <p class="hero-subtitle q-mt-md">
            Step into PUP's past through 3D-modeled artifacts and<br />
            scanned documents built to stand the test of time.
          </p>
        </div>
        <!-- Images -->
        <q-img
          src="/img/C-trophy.png"
          alt="C Trophy"
          class="trophy-center q-px-auto"
        />

        <q-img
          src="/img/L-trophy.png"
          alt="L Trophy"
          class="trophy-left q-px-auto"
        />

        <q-img
          src="/img/R-trophy.png"
          alt="R Trophy"
          class="trophy-right q-px-auto"
        />
        <div class="q-pa-md"></div>
      </div>
    </div>
    <div class="bottom-shadow-overlay"></div>

    <div class="main-tile">
      <div class="q-pa-md">
        <h1 class="font-benne text-tertiary text-center brand-title">
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
  background-attachment: fixed
}

.logo-img {
  width: 4.375rem;
  height: 4.375rem;
  flex-shrink: 0;
  aspect-ratio: 1/1;
  left: 100%;
}

.main-content {
  position: relative;
}

.content-text {
  margin: 3rem; /* q-ma-xl equivalent */
  padding-left: 1.875rem;
}

.hero-title {
  letter-spacing: 0.047rem;
}

.hero-subtitle {
  color: #fff6c1;
  letter-spacing: 0.047rem;
  font-size: 0.875rem;
  font-weight: 300;
}

.trophy-center {
  width: 41.875rem;
  height: auto;
  position: absolute;
  bottom: -18.75rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  object-fit: contain;
}

.trophy-left {
  width: 20.313rem;
  height: auto;
  position: absolute;
  bottom: -19.375rem;
  right: 62.5rem;
  z-index: 1;
  object-fit: contain;
}

.trophy-right {
  width: 23.75rem;
  height: auto;
  position: absolute;
  bottom: -18.75rem;
  left: 62.5rem;
  z-index: 1;
  object-fit: contain;
}

.bottom-shadow-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 21.875rem;
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
  text-shadow: 4.375rem 1.875rem 0.25rem rgba(0, 0, 0, 0.55); /* 70px 30px 4px */
}

.brand-title {
  letter-spacing: 0.313rem;
}

.main-tile {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 0.938rem;
  z-index: 100;
  width: 100%;
  text-align: center;
}

/* ========================
 RESPONSIVE DESIGN
======================== */

@media (min-width: 110rem) {
  .content-text {
    margin: 5rem;
    padding-left: 4rem;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .trophy-center {
    width: 48rem;
    bottom: -20rem !important;
  }

  .trophy-left {
    width: 25rem;
    right: 84rem;
  }

  .trophy-right {
    width: 28rem;
    left: 84rem;
  }

  .bottom-shadow-overlay {
    height: 30rem;
  }

  .brand-title {
    font-size: 10rem;
    letter-spacing: 0.625rem;
  }

  .main-tile {
    bottom: 3rem;
  }

  .logo-img {
    width: 6rem;
    height: 6rem;
  }
}


@media (max-width: 90rem) {
  .trophy-left {
    right: 50rem;
  }

  .trophy-right {
    left: 50rem;
  }
}

@media (max-width: 75rem) {
  .trophy-left {
    right: 40rem;
    width: 18rem;
  }

  .trophy-right {
    left: 40rem;
    width: 21rem;
  }

  .trophy-center {
    width: 38rem;
  }
}

@media (max-width: 64rem) {
  .content-text {
    margin: 2rem;
    padding-left: 1rem;
  }

  .trophy-left,
  .trophy-right {
    opacity: 0.5;
  }

  .trophy-left {
    right: 30rem;
    width: 15rem;
  }

  .trophy-right {
    left: 30rem;
    width: 18rem;
  }

  .trophy-center {
    width: 32rem;
  }
}

@media (max-width: 48rem) {
  .logo-img {
    width: 3.5rem;
    height: 3.5rem;
  }

  .content-text {
    margin: 2rem 1.5rem;
    padding-left: 1rem;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 0.938rem;
  }

  .trophy-left,
  .trophy-right {
    display: none;
  }


  .bottom-shadow-overlay {
    height: 18rem;
  }

  .brand-title {
    font-size: 5rem;
    letter-spacing: 0.3rem;
  }

  .main-tile {
    bottom: 2.5rem;
  }
}

@media (max-width: 30rem) {
  .logo-img {
    width: 3rem;
    height: 3rem;
  }

  .content-text {
    margin: 1rem;
    padding-left: 0.5rem;
  }

  .hero-title {
    font-size: 1.5rem;
  }

  .hero-title br {
    display: none;
  }

  .hero-subtitle {
    font-size: 0.813rem;
  }

  .trophy-center {
    width: 20rem;
    bottom: -8rem;
  }

  .bottom-shadow-overlay {
    height: 14rem;
  }

  .brand-title {
    font-size: 2.5rem;
    letter-spacing: 0.2rem;
  }

  .main-tile {
    bottom: 2rem;
  }
}

/* ========================
 HEIGHT ADJUSTMENTS
======================== */

@media (min-height: 54rem) {
  .trophy-center {
    bottom: -24.45rem;
  }

  .trophy-left {
    bottom: -24rem;
  }

  .trophy-right {
    bottom: -23rem;
  }

  .bottom-shadow-overlay {
    height: 29rem;
  }

  .main-tile {
    bottom: 5rem;
  }
}


/* Shorter screens - keep trophies closer */
@media (max-height: 43.75rem) {
  .trophy-center {
    width: 36rem;
    bottom: -14rem;
  }

  .trophy-left {
    width: 16rem;
    bottom: -14rem;
  }

  .trophy-right {
    width: 19rem;
    bottom: -14rem;
  }

  .bottom-shadow-overlay {
    height: 18rem;
  }

  .main-tile {
    font-size: 92px;
    bottom: 0.5rem;
  }

  .hero-title {
    font-size: 30px;
  }
  .hero-subtitle {
    font-size: 10px;
  }
}

/* Very short heights */
@media (max-height: 31.25rem) {
  .trophy-center {
    bottom: -10rem;
  }

  .trophy-left {
    bottom: -10rem;
  }

  .trophy-right {
    bottom: -10rem;
  }

  .bottom-shadow-overlay {
    height: 14rem;
  }

  .main-tile {
    bottom: 0.3rem;
  }
}
</style>
