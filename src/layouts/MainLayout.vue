<template>
  <div class="q-pa-md">
    <q-layout view="lHh Lpr lFf">
      <q-drawer
        v-model="drawer"
        show-if-above
        @mouseenter="onDrawerMouseEnter"
        @mouseleave="onDrawerMouseLeave"
        :width="miniState ? 120 : 280"
        :breakpoint="500"
        bordered
        :class="'bg-transparent sidebar-drawer'"
        content-class="drawer-content"
      >
        <div class="absolute-full flex column">
          <!-- Expanded State -->
          <div class="q-pa-md q-mb-md" v-show="!miniState">
            <div class="text-center q-py-lg">
              <img
                src="\src\assets\img\logo.png"
                alt="Your Logo"
                style="max-width: 200px; max-height: 80px; object-fit: contain;"
                class="q-mb-sm"
              />
            </div>
          </div>

          <!-- Mini State -->
          <div class="q-pa-lg q-mb-sm text-center" v-show="miniState">
            <img
              src="\src\assets\img\logo.png"
              alt="Logo"
              style="width: 60px; height: 60px; object-fit: contain;"
            />
          </div>

          <div class="col" />

          <!-- Navigation -->
          <q-list padding :class="{ 'text-center': miniState }">
            <q-item
              v-for="item in navItems"
              :key="item.name"
              clickable
              v-ripple
              :active="activeItem === item.name"
              @click="setActiveItem(item.name)"
              class="nav-item"
            >
              <q-item-section avatar>
                <div class="icon-wrapper">
                  <img
                    :src="item.icon"
                    :alt="item.label"
                    style="width: 30px; height: 30px; object-fit: contain;"
                    class="nav-icon"
                  />
                </div>
              </q-item-section>
              <q-item-section>
                <span :class="{ 'text-hidden': miniState }" class="nav-text">{{ item.label }}</span>
              </q-item-section>
            </q-item>
          </q-list>

          <div class="col" />

          <!-- Logout -->
          <div class="q-pa-md">
            <q-separator class="q-mb-md" v-show="!miniState" />
            <q-item
              clickable
              v-ripple
              @click="handleLogout"
              class="logout-item"
              :class="{ 'text-center': miniState }"
            >
              <q-item-section avatar>
                <div class="icon-wrapper">
                  <q-icon name="logout" size="24px" class="logout-icon" />
                </div>
              </q-item-section>
              <q-item-section v-show="!miniState">
                <span class="logout-text">Logout</span>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-drawer>

      <q-page-container>
        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const drawer = ref(false)
const miniState = ref(true)

const navItems = [
  { name: 'home', label: 'Home', icon: '\\src\\assets\\icon\\home.png' },
  { name: 'artifacts', label: 'Artifacts', icon: '\\src\\assets\\icon\\artifacts.png' },
  { name: 'documents', label: 'Documents', icon: '\\src\\assets\\icon\\book.png' }
]

// Add a timeout to prevent rapid state changes
let hoverTimeout = null

const onDrawerMouseEnter = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  miniState.value = false
}

const onDrawerMouseLeave = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  // Immediate collapse without animation delay
  miniState.value = true
}

const activeItem = ref('home')
const setActiveItem = (itemName) => {
  activeItem.value = itemName

  // Navigate to the corresponding route
  const targetRoute = `/${itemName}`
  router.push(targetRoute)
}

const handleLogout = () => {
  // Add logout logic here
  console.log('Logging out...')

  if (confirm('Are you sure you want to logout?')) {
    router.push('/login')
  }
}

onMounted(() => {
  // Extract the route path without leading slash
  const currentPath = route.path.substring(1)

  // If we're on the root path, set active to 'home'
  if (route.path === '/') {
    activeItem.value = 'home'
  }
  // Otherwise set active to the current path if it matches a sidebar item
  else if (['artifacts', 'documents'].includes(currentPath)) {
    activeItem.value = currentPath
  }
})
</script>
