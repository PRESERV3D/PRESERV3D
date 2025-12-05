<template>
  <div class="mobile-not-supported-wrapper">
    <div class="mobile-not-supported">
      <div class="mobile-message-container">
        <q-img src="/img/logo.png" alt="Logo" class="mobile-logo" />
        <h3 class="text-tertiary q-mb-md font-benne mobile-brand">
          PRESERV<span class="text-secondary">3D</span>
        </h3>
        <p class="text-white q-mb-md text-center">Mobile view is not currently supported.</p>
        <p class="text-white text-center" style="opacity: 0.8; font-size: 0.875rem">
          Please access this site on a desktop or tablet device for the best experience.
        </p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MobileNotSupported',
}
</script>

<style scoped>
/* ========================
 MOBILE NOT SUPPORTED
======================== */
.mobile-not-supported-wrapper {
  display: none;
}

.mobile-not-supported {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
  padding: 2rem;
}

@media (max-width: 48rem) {
  .mobile-not-supported-wrapper {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    background:
      linear-gradient(0deg, rgba(63, 4, 4, 0.8) 70%, rgba(0, 0, 0, 0.9) 99%), url('/img/bg-img.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    background-color: #880000;
    overflow: hidden;
  }

  .mobile-message-container {
    text-align: center;
    max-width: 25rem;
  }

  .mobile-logo {
    width: 5rem;
    height: 5rem;
    margin: 0 auto 1.5rem;
  }

  .mobile-brand {
    letter-spacing: 0.2rem;
  }
}

@font-face {
  font-family: 'Benne';
  src: url(src/assets/fonts/Benne.ttf) format('truetype');
}

.font-benne {
  font-family: 'Benne', sans-serif;
}
</style>
