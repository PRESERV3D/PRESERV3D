<template>
  <q-page class="flex flex-center">
    <model-viewer
      src="https://pub-8c8eb005cca947a7821974e5e66ea477.r2.dev/model.glb"
      camera-controls
      auto-rotate
      style="width: 100%; height: 300px"
    />
  </q-page>
</template>

<script setup>
import '@google/model-viewer'
</script>
