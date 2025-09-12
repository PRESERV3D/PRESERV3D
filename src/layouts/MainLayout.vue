<template>
  <div class="q-pa-md main-page-bg">
    <q-layout view="lHh Lpr lFf">
      <q-drawer
        v-model="drawer"
        :show-if-above="true"
        :mini="miniState"
        :mini-to-overlay="true"
        :mini-width="120"
        @mouseenter="onDrawerMouseEnter"
        @mouseleave="onDrawerMouseLeave"
        :width="280"
        :breakpoint="0"
        bordered
        :class="'sidebar-drawer'"
        content-class="drawer-content"
      >
        <div class="sidebar-container">
          <!-- Logo Section -->
          <div class="logo-section">
            <!-- Expanded State -->
            <div class="q-pa-md q-mb-md" v-show="!miniState || isHovered">
              <div class="text-center q-py-lg">
                <img
                  src="\img\logo.png"
                  alt="PRESERV3D"
                  class="logo-img q-mb-sm"
                  @click="setActiveItem('home')"
                />
              </div>
            </div>

            <!-- Mini State -->
            <div class="q-pa-lg q-mb-sm text-center" v-show="miniState && !isHovered">
              <img
                src="\img\logo.png"
                alt="Logo"
                style="width: 60px; height: 60px; object-fit: contain"
              />
            </div>
          </div>

          <!-- Navigation Section -->
          <div class="navigation-section">
            <q-list padding :class="{ 'text-center': miniState && !isHovered }">
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
                      style="width: 24px; height: 24px; object-fit: contain"
                      class="nav-icon"
                    />
                  </div>
                </q-item-section>
                <q-item-section>
                  <span :class="{ 'text-hidden': miniState && !isHovered }" class="nav-text">{{
                      item.label
                    }}</span>
                </q-item-section>
              </q-item>
            </q-list>
          </div>

          <!-- Logout Section - Fixed at bottom -->
          <div class="logout-section">
            <q-separator class="q-mb-md" v-show="!miniState || isHovered" />
            <q-item
              clickable
              v-ripple
              @click="handleLogout"
              class="logout-item"
              :class="{ 'text-center': miniState && !isHovered }"
            >
              <q-item-section avatar>
                <div class="icon-wrapper">
                  <q-icon name="logout" size="20px" class="logout-icon" />
                </div>
              </q-item-section>
              <q-item-section v-show="!miniState || isHovered">
                <span class="logout-text">Logout</span>
              </q-item-section>
            </q-item>
          </div>
        </div>
      </q-drawer>

      <q-page-container>
        <div v-if="hasSearchBar" class="search-toolbar">
          <div class="responsive-toolbar-container">
            <!-- Search Bar Container with Internal Dropdown -->
            <div class="search-container">
              <q-input
                dense
                outlined
                v-model="search"
                placeholder="Search name, work, year, etc."
                clearable
                clear-icon="close"
                @keyup.enter="performSearch"
                class="search-input no-gap"
                style="width: 100%;"
              >
                <!-- dropdown select on the far left -->
                <template v-slot:prepend>
                  <q-select
                    dense
                    borderless
                    flat
                    v-model="searchType"
                    :options="searchOptions"
                    emit-value
                    map-options
                    @update:model-value="performSearch"
                    style="width: 140px; text-align: center;"
                    popup-content-style="text-align: center; text-transform: capitalize;"
                  >
                    <template v-slot:selected>
                      <div style="width: 100%; text-align: center; text-transform: capitalize;">
                        {{ searchType }}
                      </div>
                    </template>
                  </q-select>

                  <!-- search icon appears right after dropdown -->
                  <q-icon
                    name="search"
                    @click="performSearch"
                    class="cursor-pointer"
                    style="margin: 0 8px;"
                  />
                </template>
              </q-input>
            </div>

            <!-- Spacer to push actions to the right -->
            <div class="toolbar-spacer"></div>

            <!-- Notifications and user profile -->
            <div class="toolbar-actions">
              <!-- Notifications Button -->
              <q-btn flat round dense class="notif-btn">
                <img src="/icons/notif-icon.png" alt="notifications" class="notif-image" />
                <q-badge
                  floating
                  rounded
                  class="custom-badge"
                  style="background-color: #ff5722; color: white"
                  v-if="notificationCount > 0"
                >
                  {{ notificationCount }}
                </q-badge>
                <q-menu>
                  <q-list style="min-width: 150px">
                    <q-item-label header>Notifications</q-item-label>
                    <q-item v-if="notifications.length === 0">
                      <q-item-section>No new notifications</q-item-section>
                    </q-item>
                    <q-item v-for="notif in notifications" :key="notif.id" clickable v-ripple>
                      <q-item-section>{{ notif.message }}</q-item-section>
                      <q-item-section side>{{ notif.time }}</q-item-section>
                    </q-item>
                    <q-separator />
                    <q-item clickable class="text-center text-primary">
                      <q-item-section>View All</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>

              <!-- User Profile Button -->
              <q-btn flat dense class="user-profile-btn" :class="{ 'compact': isCompactMode }">
                <q-avatar size="32px">
                  <img src="\img\UserIcon.jpg" />
                </q-avatar>
                <div class="user-info" v-show="!isCompactMode">
                  <div class="username-bg">{{ userName }}</div>
                  <div class="text-subtitle2 text-grey user-role">{{ userType }}</div>
                </div>
                <q-tooltip v-if="isCompactMode" anchor="bottom middle" self="top middle">
                  {{ userName }} ({{ userType }})
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <router-view />
      </q-page-container>
    </q-layout>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUserStore } from 'src/stores/user'
import { useSearchStore } from 'src/stores/searchStore'
import { useDocumentsStore } from 'src/stores/documentsStore'
import { useDocumentsFilter } from 'src/utils/useFiltering'
const { clearFilters } = useDocumentsFilter()

const $q = useQuasar()
const userStore = useUserStore()
const searchStore = useSearchStore()
const documentsStore = useDocumentsStore()
const router = useRouter()
const route = useRoute()
const session = userStore.session

const drawer = ref(true)
const miniState = ref(true)
const isHovered = ref(false)
const search = ref('')

// Responsive state
const windowWidth = ref(window.innerWidth)
const isCompactMode = computed(() => windowWidth.value < 1030)

// Search dropdown options
const searchType = ref('artifacts') // default selection
const searchOptions = [
  { label: 'Artifacts', value: 'artifacts' },
  { label: 'Documents', value: 'documents' },
]

// User and notifications data
const notifications = ref([
  { id: 1, message: 'New message from Mrs. Beth', time: '5m ago' },
  { id: 2, message: '⚠️ Notice: The file you uploaded appears incomplete.', time: '1h ago' },
])

const notificationCount = computed(() => notifications.value.length)

// Base navigation items
const baseNavItems = [
  { name: 'home', label: 'Home', icon: '\\icons\\home.png' },
  { name: 'data-quality', label: 'Data Quality', icon: '\\icons\\data_quality.png' },
  { name: 'appointment', label: 'Appointment', icon: '\\icons\\appointment.png' },
  { name: 'artifacts', label: 'Artifacts', icon: '\\icons\\artifacts.png' },
  { name: 'documents', label: 'Documents', icon: '\\icons\\book.png' },
  { name: 'collections', label: 'Collections', icon: '\\icons\\collections.png' },
  { name: 'gallery', label: 'Gallery', icon: '\\icons\\gallery.png' },
]

// Get profile data from userStore
const userProfile = computed(() => userStore.profile || {})
const userName = computed(() => userProfile.value.first_name || 'User')
const userRole = computed(() => userProfile.value.role || 'Unknown')
const userType = computed(() => userProfile.value.user_type || 'Unknown')

// Add computed property to check roles
const isUser = computed(() => userRole.value === 'user')
const isAdmin = computed(() => userRole.value === 'admin')

// Filtered navigation items based on user role
const navItems = computed(() => {
  return baseNavItems.filter((item) => {
    // Show collections only for users
    if (item.name === 'collections') {
      return isUser.value
    }

    // Hide data-quality if the user is not admin
    if (item.name === 'data-quality') {
      return isAdmin.value
    }

    // Show all other items
    return true
  })
})

// Window resize handler
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

// Add a timeout to prevent rapid state changes
let hoverTimeout = null

const onDrawerMouseEnter = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)
  isHovered.value = true
  // Only expand if currently in mini state
  if (miniState.value) {
    miniState.value = false
  }
}

const onDrawerMouseLeave = () => {
  if (hoverTimeout) clearTimeout(hoverTimeout)

  // Add a small delay to prevent flickering
  hoverTimeout = setTimeout(() => {
    isHovered.value = false
    miniState.value = true
  }, 100) // 100ms delay
}

const activeItem = ref('home')
const hasSearchBar = ref(false)

const setActiveItem = (itemName) => {
  console.log('Setting active item to:', itemName)
  activeItem.value = itemName

  // Close mobile drawer when navigating
  if ($q.screen.lt.md) {
    drawer.value = false
  }

  if (itemName === 'home') {
    const role = session.user.user_metadata?.role

    if (role === 'admin') {
      activeItem.value = 'home'
      router.push('/admindash')
      return
    } else if (role === 'user') {
      activeItem.value = 'home'
      router.push('/home')
      return
    }
    return
  } else {
    // Navigate to the corresponding route

    const targetRoute = `/${itemName}`
    router.push(targetRoute)
  }
}

// Search functionality
const performSearch = async () => {
  documentsStore.resetFilters()
  clearFilters()

  const query = search.value
  if (!query.trim()) {
    searchStore.clear()
    return
  }

  // Redirect based on dropdown selection
  let targetRoute = ''
  if (searchType.value === 'artifacts') {
    targetRoute = '/artifacts'
  } else if (searchType.value === 'documents') {
    targetRoute = '/documents'
  }

  if (route.path !== targetRoute) {
    await router.push(targetRoute) // Wait for navigation to complete
  }

  // Set store search type based on dropdown selection
  await searchStore.search(query, searchType.value)
  console.log('Search performed:', query, searchType.value)

  search.value = ''
}

const handleLogout = async () => {
  try {
    if (confirm('Are you sure you want to logout?')) {
      await userStore.signOut()
      router.push('/user/login')
    }
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)

  if (searchType.value) {
    if (route.name === 'documents') {
      searchType.value = 'documents'
    } else if (route.name === 'artifacts') {
      searchType.value = 'artifacts'
    }
  }

  // Perform search if there's existing search value
  if (search.value || searchType.value) {
    performSearch()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (hoverTimeout) clearTimeout(hoverTimeout)
})

// Watch search bar input and run query
watch(search, async (query) => {
  if (query === null || query === undefined) {
    searchStore.clear()
    return
  }
})

// Watch for route changes to update active item
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/') {
      activeItem.value = 'home'
    } else if (
      newPath.includes('home') ||
      newPath.includes('admindash') ||
      newPath.includes('collection')
    ) {
      activeItem.value = 'home'
    } else if (newPath.includes('appointment')) {
      activeItem.value = 'appointment'
    } else if (newPath.includes('artifacts')) {
      activeItem.value = 'artifacts'
      searchType.value = 'artifacts'
    } else if (newPath.includes('documents') || newPath.includes('document-scanner')) {
      activeItem.value = 'documents'
      searchType.value = 'documents'
    } else if (newPath.includes('collections')) {
      activeItem.value = 'collections'
    } else if (newPath.includes('gallery')) {
      activeItem.value = 'gallery'
    } else {
      activeItem.value = ''
    }

    // Search bar visibility
    if (
      newPath.includes('admindash') ||
      newPath.includes('home') ||
      newPath.includes('artifacts') ||
      newPath.includes('documents')
    ) {
      hasSearchBar.value = true
    } else {
      hasSearchBar.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
/* ========================
   GENERAL FIXES
======================== */

.no-gap :deep(.q-field__prepend) {
  margin-left: 0 !important;
  padding-left: 0 !important;
  min-width: 0 !important;
}

.no-gap :deep(.q-field__control) {
  padding-left: 0 !important;
}

/* ========================
   MAIN LAYOUT FIXES
======================== */
.main-page-bg {
  overflow-x: hidden !important;
  max-width: 100vw;
}

.q-layout {
  overflow-x: hidden !important;
}

.q-page-container {
  overflow-x: hidden !important;
  margin-left: 0 !important; /* No margin - content stays in place */
  transition: none !important;
}

/* ========================
   SIDEBAR OVERLAY BEHAVIOR
======================== */
.sidebar-drawer.q-drawer {
  overflow: hidden;
  transition: width 0.3s ease !important;
  z-index: 2000 !important; /* Ensure sidebar is above content */
}

/* Mini sidebar should not affect content positioning */
.q-drawer--mini {
  z-index: 2000 !important;
}

/* When expanded (on hover), sidebar overlays content */
.sidebar-drawer:hover {
  z-index: 2001 !important; /* Higher z-index when expanded */
}

/* ========================
   LOGO
======================== */
.logo-img {
  max-width: 200px;
  max-height: 80px;
  object-fit: contain;
  cursor: pointer;
}

/* ========================
   SIDEBAR
======================== */
.sidebar-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.navigation-section {
  flex: 1;
  min-height: 0;
  padding: 0 8px;
  overflow-y: visible;
}

.logout-section {
  flex-shrink: 0;
  padding: 10px;
  margin-top: auto;
}

/* ========================
   TEXT VISIBILITY IMPROVEMENTS
======================== */
.nav-text, .logout-text {
  opacity: 1;
  transition: opacity 0.2s ease, width 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.text-hidden {
  opacity: 0 !important;
  width: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.sidebar-drawer:hover .text-hidden {
  opacity: 1 !important;
  width: auto !important;
}

/* ========================
   RESPONSIVE TOOLBAR - NORMAL POSITIONING
======================== */
.search-toolbar {
  background: transparent !important;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 8px 16px !important;
  width: 100% !important; /* Full width - no sidebar offset */
  box-sizing: border-box;
  position: relative !important; /* Normal positioning */
  z-index: 1000 !important;
}

/* No special toolbar positioning for sidebar states */

.responsive-toolbar-container {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 44px;
}

.search-container {
  width: 705px;
  max-width: 100%;
  margin-right: 2px;    /* spacing before notifications */
}

.toolbar-spacer {
  flex: 0 0 30px;
  width: 30px;
}

.toolbar-actions {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: 100px;
  min-width: fit-content;
  width: auto;
}

/* ========================
   SEARCH INPUT
======================== */
.search-input {
  width: 100%;
}

.search-input :deep(.q-field__control) {
  min-height: 40px;
}

/* ========================
   RESPONSIVE BREAKPOINTS
======================== */

/* Ultra-wide screens */
@media (min-width: 1920px) {
  .search-container {
    width: 1060px !important;
    min-width: 1060px !important;
    max-width: 1060px !important;
  }
  .toolbar-actions {
    gap: 100px;
  }
  .user-profile-btn:not(.compact) {
    width: 282px !important;
    min-width: 282px !important;
    max-width: 282px !important;
  }
}

/* Large screens  */
@media (min-width: 1440px) and (max-width: 1919px) {
  .search-container {
    width: 790px !important;
    min-width: 790px !important;
    max-width: 790px !important;
  }
  .toolbar-actions {
    gap: 120px;
  }
  .user-profile-btn:not(.compact) {
    width: 210px !important;
    min-width: 210px !important;
    max-width: 210px !important;
  }
}

/* Medium-large screens */
@media (min-width: 1300px) and (max-width: 1439px) {
  .search-container {
    width: 710px !important;
    min-width: 610px !important;
    max-width: 710px !important;
  }
  .toolbar-actions {
    gap: 110px;
  }
  .user-profile-btn:not(.compact) {
    width: 180px !important;
    min-width: 180px !important;
    max-width: 180px !important;
  }
}

/* my screen size */
@media (min-width: 1200px) and (max-width: 1300px) {
  .search-container {
    width: 650px !important;
    min-width: 550px !important;
    max-width: 650px !important;
    flex: none !important;
  }

  .toolbar-actions {
    gap: 60px;
    width: auto;
  }

  .user-profile-btn:not(.compact) {
    width: 180px !important;
    min-width: 180px !important;
    max-width: 180px !important;
  }
}

/* Compact screens  */
@media (min-width: 1050px) and (max-width: 1199px) {
  .search-container {
    width: 590px !important;
    min-width: 490px !important;
    max-width: 590px !important;
  }
  .toolbar-actions {
    gap: 45px;
  }
  .user-profile-btn:not(.compact) {
    width: 210px !important;
    min-width: 210px !important;
    max-width: 210px !important;
  }
}

/* Small screens */
@media (min-width: 600px) and (max-width: 1049px) {
  .search-container {
    width: 550px !important;
    min-width: 300px !important;
    max-width: 550px !important;
  }
  .toolbar-actions {
    gap: 30px;
  }
  .user-profile-btn.compact {
    width: 48px !important;
    min-width: 48px !important;
    max-width: 48px !important;
  }
}

/* Hide sidebar on tablets - sidebar still overlays */
@media (min-width: 600px) and (max-width: 1024px) {
  .q-drawer {
    width: 120px !important;
    z-index: 2000 !important;
  }

  .sidebar-drawer .q-drawer__content {
    width: 120px !important;
  }

  .navigation-section {
    text-align: center;
  }

  .nav-item .q-item__section--main,
  .logout-item .q-item__section--main {
    display: none !important;
  }

  /* Content stays in normal position */
  .q-page-container {
    margin-left: 0 !important;
  }

  .search-toolbar {
    width: 100% !important;
  }
}

/* Mobile screens - content needs space for sidebar */
@media (max-width: 599px) {
  .search-toolbar {
    padding: 12px 16px !important;
    width: calc(100% - 120px) !important; /* Account for mini sidebar */
    margin-left: 0 !important; /* Remove extra margin */
    position: relative !important;
    top: auto !important;
    right: auto !important;
  }

  .responsive-toolbar-container {
    flex-direction: row;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
  }

  .search-container {
    flex: 1 1 auto !important;
    width: auto !important;
    min-width: 180px !important;
    max-width: calc(100% - 120px) !important;
    order: 1;
  }

  .toolbar-spacer {
    display: none;
  }

  .toolbar-actions {
    flex: 0 0 auto;
    order: 2;
    gap: 8px;
    min-width: 100px;
  }

  .user-profile-btn.compact {
    width: 48px !important;
    min-width: 48px !important;
    max-width: 48px !important;
  }

  /* Keep sidebar visible on mobile but in mini state */
  .q-drawer {
    width: 120px !important;
    z-index: 2000 !important;
  }

  .sidebar-drawer .q-drawer__content {
    width: 120px !important;
  }

  .navigation-section {
    text-align: center;
  }

  .nav-item .q-item__section--main,
  .logout-item .q-item__section--main {
    display: none !important;
  }

  /* Keep the margin for sidebar */
  .q-page-container {
    margin-left: 120px !important;
    padding-left: 0 !important;
  }
}

/* ========================
   NAVIGATION ITEMS
======================== */
.nav-item,
.logout-item {
  border-radius: 12px;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.nav-item:hover {
  background-color: rgba(136, 0, 0, 0.08);
}
.logout-item:hover {
  background-color: rgba(220, 53, 69, 0.08);
}

.icon-wrapper {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.nav-item .q-item__section--avatar,
.logout-item .q-item__section--avatar {
  min-width: 60px !important;
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.text-center .nav-item,
.text-center .logout-item {
  justify-content: center !important;
  padding: 8px !important;
  margin-bottom: 16px !important;
}
.text-center .q-item__section--main {
  display: none !important;
}

.nav-item.q-item--active .icon-wrapper {
  background-color: #880000;
  box-shadow: 0 4px 12px rgba(136, 0, 0, 0.3);
  transform: scale(1.05);
}
.nav-item.q-item--active .nav-icon {
  filter: brightness(0) invert(1);
}
.nav-item.q-item--active .nav-text {
  color: #880000;
  font-weight: 600;
}

/* ========================
   TEXT STYLING
======================== */
.nav-text,
.logout-text {
  font-weight: 500;
  font-size: 16px;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}
.nav-text {
  color: #2c3e50;
  text-transform: capitalize;
}
.logout-text,
.logout-icon {
  color: #7c7c7c;
}
.logout-item:hover .logout-text,
.logout-item:hover .logout-icon {
  color: #c82333;
  font-weight: 600;
}
.logout-item:hover .logout-icon {
  transform: scale(1.1);
}

.sidebar-drawer .q-separator {
  background-color: rgba(0, 0, 0, 0.1);
  height: 1px;
}

/* ========================
   NOTIFICATIONS
======================== */
.notif-btn {
  background-color: #f8f8ff !important;
  width: 40px;
  height: 40px;
  backdrop-filter: blur(10px);
  flex-shrink: 0;
}
.notif-btn:hover {
  background-color: #e0e0e0 !important;
}
.notif-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
.custom-badge {
  font-size: 11px !important;
  font-weight: bold !important;
  min-width: 18px !important;
  height: 18px !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
}

/* ========================
   USER PROFILE
======================== */
.user-profile-btn {
  background-color: #f8f9fa !important;
  border-radius: 10px;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: all 0.3s ease;
  flex-shrink: 0;
  padding: 4px 12px 4px 8px;
}

/* Full profile display
.user-profile-btn:not(.compact) {
  width: 180px;
  min-width: 180px;
  max-width: 180px;
}

/* Compact profile (avatar only) */
.user-profile-btn.compact {
  width: 48px;
  min-width: 48px;
  max-width: 48px;
  padding: 8px;
  justify-content: center;
}

.user-profile-btn:hover {
  background-color: #e9ecef !important;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  line-height: 1.2;
  margin-left: 8px;
  flex: 1;
}

.username-bg {
  font-weight: 500;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  width: 100%;
}

.user-role {
  font-size: 12px !important;
  line-height: 1 !important;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  width: 100%;
}

/* Avatar adjustments */
.user-profile-btn .q-avatar {
  flex-shrink: 0;
}

/* Tooltip styling */
.q-tooltip {
  background-color: rgba(0, 0, 0, 0.87) !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
}
</style>
