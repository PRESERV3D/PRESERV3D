<!--View Artifact Page-->
<template>
  <q-page class="q-pa-md">
    <router-link to="/artifacts" class="back-button-top">
      <q-btn flat icon="arrow_back" label="Back to Artifacts" />
    </router-link>

    <div v-if="loading" class="loading-container">
      <q-spinner size="xl" />
    </div>

    <div v-else-if="model" class="artifact-detail-container">
      <!-- Artifact Name/Title at the top -->
      <h2 class="a-title q-mb-lg">{{ model.metadata.title }}</h2>

      <div class="main-content">
        <!-- Left Side: 3D Model Viewer Card -->
        <div class="artifact-card" ref="artifactCard">
          <model-viewer
            ref="artifactViewer"
            :src="workingModelUrl || model.file_url"
            camera-controls
            loading="lazy"
            shadow-intensity="1"
            class="large-artifacts"
          />

          <!-- Control Buttons -->
          <div class="control-buttons">
            <button class="control-btn" title="Help" @click="toggleHelp">
              <img
                src="/icons/help.png"
                alt="Help"
                class="control-icon"
                style="width: 19.5px; height: 19.5px"
              />
            </button>
            <button class="control-btn" title="Reset View" @click="resetModelView">
              <img
                src="/icons/reset.png"
                alt="Reset View"
                class="control-icon"
                style="width: 20px; height: 20px"
              />
            </button>
            <button class="control-btn" title="Zoom" @click="viewFullScreen">
              <img
                src="/icons/zoom-in.png"
                alt="Zoom"
                class="control-icon"
                style="width: 16px; height: 16px"
              />
            </button>
            <button
              class="control-btn"
              :class="{ active: isSpeaking }"
              :title="isSpeaking ? 'Stop Text-to-Speech' : 'Start Text-to-Speech'"
              @click="toggleTextToSpeech"
            >
              <q-icon
                :name="isSpeaking ? 'volume_up' : 'volume_off'"
                class="control-icon"
                size="24px"
                style="font-size: 22px !important"
              />
            </button>
          </div>

          <!-- Help Overlay -->
          <div v-if="showHelpOverlay" class="help-overlay">
            <div class="help-content">
              <button class="help-close-btn" @click="closeHelp">
                <q-icon name="close" size="20px" />
              </button>
              <div class="help-title">Navigation Controls</div>
              <div class="help-sections">
                <!-- Orbit Section -->
                <div class="help-section">
                  <div class="help-section-title">
                    <q-icon name="3d_rotation" class="help-icon" />
                    <span>Orbit</span>
                  </div>
                  <div class="help-methods">
                    <div class="help-method">
                      <q-icon name="mouse" class="method-icon" />
                      <span>Left-click and drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="touch_app" class="method-icon" />
                      <span>One-finger drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="keyboard" class="method-icon" />
                      <span>Arrow keys</span>
                    </div>
                  </div>
                </div>

                <!-- Pan Section -->
                <div class="help-section">
                  <div class="help-section-title">
                    <q-icon name="pan_tool" class="help-icon" />
                    <span>Pan</span>
                  </div>
                  <div class="help-methods">
                    <div class="help-method">
                      <q-icon name="mouse" class="method-icon" />
                      <span>Right-click and drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="touch_app" class="method-icon" />
                      <span>Two-finger drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="keyboard" class="method-icon" />
                      <span>Shift + Arrow keys</span>
                    </div>
                  </div>
                </div>

                <!-- Zoom Section -->
                <div class="help-section">
                  <div class="help-section-title">
                    <q-icon name="zoom_in" class="help-icon" />
                    <span>Zoom</span>
                  </div>
                  <div class="help-methods">
                    <div class="help-method">
                      <q-icon name="mouse" class="method-icon" />
                      <span>Mouse wheel</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="touch_app" class="method-icon" />
                      <span>Two-finger pinch</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="keyboard" class="method-icon" />
                      <span>Ctrl + Arrow keys</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Help Overlay - positioned over the artifact card -->
          <div v-if="showHelpOverlay" class="help-overlay">
            <div class="help-content">
              <!-- Close button -->
              <button class="help-close-btn" @click="closeHelp">
                <q-icon name="close" size="20px" />
              </button>

              <!-- Help Title -->
              <div class="help-title">Navigation Controls</div>

              <!-- Navigation Instructions -->
              <div class="help-sections">
                <!-- Orbit Section -->
                <div class="help-section">
                  <div class="help-section-title">
                    <q-icon name="3d_rotation" class="help-icon" />
                    <span>Orbit</span>
                  </div>
                  <div class="help-methods">
                    <div class="help-method">
                      <q-icon name="mouse" class="method-icon" />
                      <span>Left-click and drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="touch_app" class="method-icon" />
                      <span>One-finger drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="keyboard" class="method-icon" />
                      <span>Arrow keys</span>
                    </div>
                  </div>
                </div>

                <!-- Pan Section -->
                <div class="help-section">
                  <div class="help-section-title">
                    <q-icon name="pan_tool" class="help-icon" />
                    <span>Pan</span>
                  </div>
                  <div class="help-methods">
                    <div class="help-method">
                      <q-icon name="mouse" class="method-icon" />
                      <span>Right-click and drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="touch_app" class="method-icon" />
                      <span>Two-finger drag</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="keyboard" class="method-icon" />
                      <span>Shift + Arrow keys</span>
                    </div>
                  </div>
                </div>

                <!-- Zoom Section -->
                <div class="help-section">
                  <div class="help-section-title">
                    <q-icon name="zoom_in" class="help-icon" />
                    <span>Zoom</span>
                  </div>
                  <div class="help-methods">
                    <div class="help-method">
                      <q-icon name="mouse" class="method-icon" />
                      <span>Mouse wheel</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="touch_app" class="method-icon" />
                      <span>Two-finger pinch</span>
                    </div>
                    <div class="help-divider">Or</div>
                    <div class="help-method">
                      <q-icon name="keyboard" class="method-icon" />
                      <span>Ctrl + Arrow keys</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Information Panel -->
        <div class="info-section">
          <!-- Category Tag and Action Icons -->
          <div class="top-actions q-mb-lg">
            <div class="categories-container">
              <!-- Show categories if they exist, otherwise show fallback -->
              <div class="categories-section">
                <template v-if="model.metadata.categories && model.metadata.categories.length > 0">
                  <q-chip
                    v-for="(category, i) in model.metadata.categories"
                    :key="i"
                    class="category-tag"
                  >
                    {{ category }}
                  </q-chip>
                </template>
                <template v-else>
                  <!-- Fallback placeholder category as there are no data yet -->
                  <q-chip class="q-mr-sm q-mt-xs category-tag"> Uncategorized </q-chip>
                </template>
              </div>

              <!-- User Action icons (non-admin)-->
              <div v-if="!isAdmin" class="action-icons-top">
                <!-- View Icon with Count -->
                <div class="icon-with-count">
                  <q-icon name="visibility" class="action-icon view-icon" size="26px" />
                  <span class="count-text">{{ modelStore.viewCounts[model.id] || 0 }}</span>
                </div>

                <!-- Star Icon with Count -->
                <div class="icon-with-count">
                  <q-icon
                    :name="model.starred ? 'star' : 'star_border'"
                    class="action-icon star-icon"
                    :class="{ starred: model.starred }"
                    size="26px"
                    @click.stop="toggleFavorite(model, 'artifact')"
                  />
                  <span class="count-text">{{ modelStore.starCounts[model.id] || 0 }}</span>
                </div>

                <!-- Bookmark Icon -->
                <div class="icon-with-count">
                  <q-icon
                    :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                    class="action-icon bookmark-icon"
                    :class="{ bookmarked: model.bookmarked }"
                    size="24px"
                    @click.stop="toggleBookmark(model, 'artifact')"
                  />
                </div>
              </div>

              <!-- Admin Action buttons -->
              <div v-if="isAdmin" class="action-buttons">
                <q-btn
                  flat
                  label="Edit"
                  class="text-button q-mr-sm"
                  @click="editArtifact"
                  no-caps
                />
                <q-btn flat label="Delete" class="text-button" @click="showDialog = true" no-caps />
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div class="summary-section q-mb-md">
            <h6 class="a-info-title q-mb-sm q-mt-sm">Summary</h6>
            <p class="a-info-text">{{ model.metadata.summary }}</p>
          </div>

          <!-- Related Links -->
          <div
            class="q-mb-md link"
            @click="showRelatedDialog = true"
            style="margin-left: 0; margin-bottom: 5px; text-align: left"
          >
            Show Related Links
          </div>
          <q-dialog v-model="showRelatedDialog" persistent>
            <q-card class="related-box">
              <q-card-section
                class="column sub-font-3 items-start"
                style="font-size: 16px; font-weight: 700"
              >
                Related Links
              </q-card-section>
              <q-separator />
              <q-card-section class="column items-start">
                <div
                  v-for="link in links"
                  :key="link.id"
                  class="row items-center q-mb-xs full-width"
                  @click="openLink(link.url)"
                >
                  <div class="link-style" @click="openLink(link.url)">
                    {{ link.title || link.url }}
                  </div>
                </div>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn label="Close" class="btn-save" flat v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <!-- Two-Column Section -->
          <div class="two-column-details q-mt-md q-mb-lg">
            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="a-info-title2">Author</div>
                <div class="a-info-subtitle">{{ model.metadata.author }}</div>
              </div>
              <div class="detail-value">
                <div class="a-info-title2">Date</div>
                <div class="a-info-subtitle">{{ model.metadata.date }}</div>
              </div>
            </div>

            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="a-info-title2">Uploaded On</div>
                <div class="a-info-subtitle">{{ formatDate(model.uploaded_at) }}</div>
              </div>
              <div class="detail-value">
                <div class="a-info-title2">Updated On</div>
                <div class="a-info-subtitle">{{ formatDate(model.updated_at) }}</div>
              </div>
            </div>

            <!-- Single Column Section -->
            <div class="detail-item q-mb-md">
              <div class="a-info-title2">Data Source</div>
              <div class="a-info-subtitle">{{ model.data_source }}</div>
            </div>

            <!-- User Info with side-by-side layout -->
            <div class="side-by-side-details q-mb-lg">
              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Donated/Loaned By:</div>
                </div>
                <div class="detail-value">
                  <div class="a-info-subtitle">{{ model.donated_by }}</div>
                </div>
              </div>

              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Date Received:</div>
                </div>
                <div class="detail-value">
                  <div class="a-info-subtitle">
                    {{
                      model.date_received && model.date_received.trim() !== ''
                        ? formatDate(model.date_received)
                        : ''
                    }}
                  </div>
                </div>
              </div>
            </div>

            <!-- Back Button -->
            <div class="func-button">
              <router-link to="/artifacts">
                <q-btn flat label="Back" class="func-btn" no-caps />
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="error-container">
      <q-banner type="negative">Artifact not found.</q-banner>
    </div>

    <!-- Confirmation Dialog      -->
    <q-dialog v-model="showDialog" persistent>
      <q-card class="confirmation-delete">
        <q-card-section class="column items-center">
          <q-img src="/img/conf-delete.png" alt="question icon" class="question-icon" />
          <div class="q-mt-md sub-font" style="color: #000000">
            Are you sure you want to delete this?
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Yes" class="btn-save" flat @click="handleDelete" />
          <q-btn flat label="No" class="sub-font-2" style="color: #000000" v-close-popup no-caps />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Collection Dialog -->
    <q-dialog v-model="dialogOpen">
      <q-card class="add-to-collections">
        <q-card-section class="collection-header">
          <div class="sub-font-3" style="font-size: 18px; font-weight: 800">
            Choose a Collection
          </div>
        </q-card-section>
        <q-card-section class="collections-scroll-container">
          <div v-if="userCollections.length > 0">
            <div
              v-for="collection in userCollections"
              :key="collection.collection_id"
              class="q-py-sm flex items-center justify-between"
              style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 500"
            >
              <span>{{ collection.collection_name }}</span>
              <q-checkbox
                v-model="selectedCollections"
                :val="collection.collection_id"
                dense
                color="primary"
              />
            </div>
          </div>

          <div v-else class="text-caption text-grey text-center">
            You don't have any collections yet.
          </div>
        </q-card-section>

        <q-card-actions class="collection-footer" align="center">
          <q-btn label="Save" color="primary" @click="saveToSelectedCollections" />
          <q-btn flat label="Cancel" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

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
          <q-btn flat label="Close" class="btn-save" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from 'boot/supabase'
import { useModelStore } from 'stores/modelStore'
import { useUserStore } from 'stores/user'
import { generateNarration } from '/services/narration_service.js'
import { convertToWorkingUrl } from 'src/composables/useR2Url'
import '@google/model-viewer'

const route = useRoute()
const router = useRouter()
const modelStore = useModelStore()
const userStore = useUserStore()

const userRole = userStore.profile.role
const user = userStore.profile.first_name + ' ' + userStore.profile.last_name
const isAdmin = computed(() => userRole === 'admin')

const model = ref(null)
const loading = ref(true)
const workingModelUrl = ref('')

const artifactViewer = ref(null)

const dialogOpen = ref(false)
const selectedModel = ref(null)
const selectedItemType = ref('artifact')
const userCollections = ref([])
const selectedCollections = ref([])
const existingCollectionIds = ref([])

const notifyDialogOpen = ref(false)
const notifyDialogTitle = ref('')
const notifyDialogMessage = ref('')
const showDialog = ref(false)

const showHelpOverlay = ref(false)

const showRelatedDialog = ref(false)
const links = ref([])
const artifactCard = ref(null)

const hasValue = ref(false)

// function formatDate(dateStr) {
//   const date = new Date(dateStr)
//   return `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', {
//     hour: '2-digit',
//     minute: '2-digit',
//   })}`
// }

function formatDate(dateStr) {
  if (!dateStr || dateStr.toString().trim() === '') {
    return ''
  }

  const date = new Date(dateStr)

  const formattedDate = date.toLocaleDateString('en-CA')
  const formattedTime = date.toLocaleTimeString('en-PH', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return `${formattedDate} ${formattedTime}`
}

const isSpeaking = ref(false)
let currentUtterance = null


const initVoices = () => {
  return new Promise((resolve) => {
    let voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {

      resolve(voices)
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices()

        resolve(voices)
      }
    }
  })
}

const toggleTextToSpeech = async () => {
  const { data: artifactData } = await supabase
    .from('artifacts_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (isSpeaking.value) {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
    return
  }

  const narration = generateNarration(artifactData)
  if (!narration) return

  // Create speech utterance
  currentUtterance = new SpeechSynthesisUtterance(narration)
  currentUtterance.lang = 'en-US'
  currentUtterance.rate = 0.85
  currentUtterance.pitch = 1.7
  currentUtterance.volume = 1.0


  const voices = window.speechSynthesis.getVoices()

  const femaleVoicePatterns = [
    'Google US English Female',
    'Microsoft Zira',
    'Samantha',
    'Victoria',
    'Karen',
    'Moira',
    'Tessa',
    'Google UK English Female',
    'female'
  ]

  let selectedVoice = null
  for (const pattern of femaleVoicePatterns) {
    selectedVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes(pattern.toLowerCase()) ||
        v.name.toLowerCase().includes('female'))
    )
    if (selectedVoice) break
  }

  // Fallback
  if (!selectedVoice) {
    selectedVoice = voices.find(v =>
      v.lang.startsWith('en') &&
      v.name.toLowerCase().includes('female')
    )
  }

  if (selectedVoice) {
    currentUtterance.voice = selectedVoice
    console.log('Using voice:', selectedVoice.name)
  } else {
    console.log('No female voice found, using default')
  }

  currentUtterance.onend = () => {
    isSpeaking.value = false
  }

  currentUtterance.onerror = (event) => {
    console.error('Speech synthesis error:', event)
    isSpeaking.value = false
  }

  window.speechSynthesis.speak(currentUtterance)
  isSpeaking.value = true
}

// Help button click
const toggleHelp = () => {
  showHelpOverlay.value = !showHelpOverlay.value
}

// Close help overlay
const closeHelp = () => {
  showHelpOverlay.value = false
}

// Reset model view function
let defaultOrbit = ''
let defaultFOV = ''
let defaultTarget = ''
function resetModelView() {
  if (artifactViewer.value) {
    artifactViewer.value.setAttribute('camera-orbit', defaultOrbit)
    artifactViewer.value.setAttribute('field-of-view', defaultFOV)
    artifactViewer.value.setAttribute('camera-target', defaultTarget)
  }
}

// Full screen function
function viewFullScreen() {
  const el = artifactCard.value
  if (!el) return

  // Check if in full screen
  if (
    document.fullscreenElement || // Normal
    document.webkitFullscreenElement || // Safari
    document.msFullscreenElement // IE/Edge
  ) {
    // Exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if (document.webkitExitFullscreen) {
      el.webkitExitFullscreen()
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen()
    }
  } else {
    // Enter fullscreen
    if (el.requestFullscreen) {
      el.requestFullscreen()
    } else if (el.webkitRequestFullscreen) {
      el.webkitRequestFullscreen()
    } else if (el.msRequestFullscreen) {
      el.msRequestFullscreen()
    }
  }
}

// Action button methods
const editArtifact = () => {
  router.push(`/edit/artifacts/${model.value.id}`)
}

const toggleBookmark = async (modelId) => {
  if (!model.value) return

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  const { data: userCollections } = await supabase
    .from('collections')
    .select('collection_id')
    .neq('collection_name', 'Favorites') // Exclude Favorites
    .eq('user_id', userId)

  if (userCollections) {
    const { data: collItems } = await supabase
      .from('collection_items')
      .select('item_id')
      .in(
        'collection_id',
        userCollections.map((c) => c.collection_id),
      )
      .eq('item_type', 'artifact')
      .eq('item_id', route.params.id)

    console.log('Collection Items:', collItems)

    if (collItems?.length > 0) {
      model.value.bookmarked = true
    } else {
      model.value.bookmarked = false
    }
  }

  // Update in store if model exists there
  const storeModel = modelStore.models.find((m) => m.id === modelId)
  if (storeModel) {
    storeModel.bookmarked = model.value.bookmarked
  }

  openBookmarkDialog(model.value, 'artifact')
}

// FIXED: Toggle favorite
const toggleFavorite = async (model, itemType = 'artifact') => {
  if (!model) return

  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error:', authError)
    return
  }

  try {
    // Find or create Favorites collection
    let { data: favoritesCollection } = await supabase
      .from('collections')
      .select('*')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (!favoritesCollection) {
      const { data: newCollection, error: insertError } = await supabase
        .from('collections')
        .insert([
          {
            collection_name: 'Favorites',
            description: 'Items you marked as favorite will appear here.',
            user_id: userId,
            is_default: true,
            is_locked: true,
            created_at: new Date(),
            updated_at: new Date(),
            cover_url:
              'https://jruqvzpclhwjkttxhhtt.supabase.co/storage/v1/object/public/collection-covers//favoritescover.png',
          },
        ])
        .select()
        .single()

      if (insertError) {
        console.error('Insert collection failed:', insertError)
      } else {
        favoritesCollection = newCollection
      }
    }

    const collectionId = favoritesCollection.collection_id
    const itemName = model.metadata?.title || model.file_name

    // Check if item already exists
    const { data: existing } = await supabase
      .from('collection_items')
      .select('*')
      .eq('collection_id', collectionId)
      .eq('item_id', model.id)
      .eq('item_type', itemType)

    if (existing.length > 0) {
      // Remove from favorites
      await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', model.id)
        .eq('item_type', itemType)

      model.starred = false
      showNotifyDialog('Notice', `"${itemName}" was removed from Favorites.`)
    } else {
      // Add to favorites
      await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: model.id,
        item_type: itemType,
      })

      model.starred = true
      showNotifyDialog('Notice', `"${itemName}" was added to Favorites.`)
    }

    // Get star count
    const { data: metaCheck, error: metaError } = await supabase
      .from('artifacts_metadata')
      .select('id')
      .eq('id', model.id)
      .single()

    // FIXED: Star count
    if (!metaError && metaCheck) {
      const { data: starData } = await supabase
        .from('artifacts_star_count')
        .select('star_count')
        .eq('item_id', model.id)
        .maybeSingle()

      if (starData && starData.star_count !== undefined) {
        modelStore.updateStarCount(model.id, starData.star_count)
      } else {
        // If no row exists, star count is 0
        modelStore.updateStarCount(model.id, 0)
      }
    } else {
      console.error('Model ID not found in artifacts_metadata:', metaError)
    }
  } catch (err) {
    console.error('Error toggling favorite:', err)
  }
}

// Collection dialog methods
const openBookmarkDialog = async (modelItem, type = 'artifact') => {
  selectedModel.value = modelItem
  selectedItemType.value = type
  dialogOpen.value = true

  await loadUserCollections()

  // Check existing collections for this item
  const { data: existingItems, error } = await supabase
    .from('collection_items')
    .select('collection_id')
    .eq('item_id', modelItem.id)
    .eq('item_type', type)

  if (error) {
    console.error('Error checking existing collections:', error)
    selectedCollections.value = []
    existingCollectionIds.value = []
    return
  }

  const existingIds = existingItems.map((item) => item.collection_id)
  selectedCollections.value = [...existingIds]
  existingCollectionIds.value = [...existingIds]
}

const loadUserCollections = async () => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (authError || !userId) {
    console.error('Auth error loading collections:', authError)
    return
  }

  const { data, error } = await supabase
    .from('collections')
    .select('collection_id, collection_name')
    .eq('user_id', userId)

  if (!error) {
    // Exclude "Favorites" from the list
    userCollections.value = data.filter((c) => c.collection_name !== 'Favorites')
  } else {
    console.error('Failed to load collections:', error)
  }
}

const saveToSelectedCollections = async () => {
  const modelItem = selectedModel.value

  if (!modelItem) return

  try {
    const insertedCollections = []
    const removedCollections = []

    const toAdd = selectedCollections.value.filter(
      (id) => !existingCollectionIds.value.includes(id),
    )
    const toRemove = existingCollectionIds.value.filter(
      (id) => !selectedCollections.value.includes(id),
    )

    for (const collectionId of toAdd) {
      const collection = userCollections.value.find((c) => c.collection_id === collectionId)

      const { error: insertError } = await supabase.from('collection_items').insert({
        collection_id: collectionId,
        item_id: modelItem.id,
        item_type: selectedItemType.value,
      })

      if (insertError) {
        console.error('Insert failed:', insertError)
        showNotifyDialog('Error', 'Failed to save to collection(s).')
        return
      }

      if (collection) insertedCollections.push(collection.collection_name)
      model.value.bookmarked = true
    }

    for (const collectionId of toRemove) {
      const collection = userCollections.value.find((c) => c.collection_id === collectionId)

      const { error: deleteError } = await supabase
        .from('collection_items')
        .delete()
        .eq('collection_id', collectionId)
        .eq('item_id', modelItem.id)
        .eq('item_type', selectedItemType.value)

      if (deleteError) {
        console.error('Delete failed:', deleteError)
        showNotifyDialog('Error', 'Failed to remove from collection(s).')
        return
      }

      if (collection) removedCollections.push(collection.collection_name)
      model.value.bookmarked = false
    }

    const itemName = modelItem.metadata?.title || modelItem.file_name
    let message = ''

    if (insertedCollections.length > 0) {
      message += `"${itemName}" was added to: ${insertedCollections.join(', ')}.\n`
    }

    if (removedCollections.length > 0) {
      message += `"${itemName}" was removed from: ${removedCollections.join(', ')}.`
    }

    if (message) {
      showNotifyDialog('Notice', message.trim())
    }

    dialogOpen.value = false
  } catch (err) {
    console.error('Unexpected error:', err)
    showNotifyDialog('Error', 'An unexpected error occurred.')
  }
}

const showNotifyDialog = (title, message) => {
  notifyDialogTitle.value = title
  notifyDialogMessage.value = message
  notifyDialogOpen.value = true
}

onMounted(async () => {
  await initVoices()
  const { data, error } = await supabase
    .from('artifacts_metadata')
    .select('*')
    .eq('id', route.params.id)
    .single()

  if (error || !data) {
    console.error('Artifact not found from Supabase:', error)
    // Fallback to modelStore if Supabase fails
    model.value = modelStore.models.find((m) => m.id == route.params.id) || null
    console.log('Fallback Model from Store:', model.value)
    if (!model.value) {
      loading.value = false
      router.replace('/not-found')
      return
    }
  } else {
    // Add some default values for compatibility
    model.value = {
      ...data,
      bookmarked: false,
      starred: false,
    }

    // Convert stored URL to working presigned URL
    try {
      if (data.file_url) {
        workingModelUrl.value = await convertToWorkingUrl(data.file_url)
        console.log('✅ Generated working URL for artifact')
      }
    } catch (urlError) {
      console.error('⚠️ Could not generate working URL, using stored URL:', urlError)
      workingModelUrl.value = data.file_url
    }

    if (data.related_links && Array.isArray(data.related_links)) {
      links.value = data.related_links.map((link, idx) => ({
        id: link.id || Date.now() + idx,
        title: link.title,
        url: link.url,
      }))
    }
  }

  if (!data.donated_by || data.donated_by === '[Donor/Lender Name]') {
    hasValue.value = false
  } else {
    hasValue.value = true
  }

  loading.value = false

  // Check if the artifact is in user's Favorites collection
  const { data: authData } = await supabase.auth.getUser()
  const userId = authData?.user?.id

  if (userId) {
    const { data: favoritesCollection } = await supabase
      .from('collections')
      .select('collection_id')
      .eq('user_id', userId)
      .eq('collection_name', 'Favorites')
      .maybeSingle()

    if (favoritesCollection) {
      const { data: favItems } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_type', 'artifact')
        .eq('item_id', route.params.id)

      if (favItems?.length > 0) {
        model.value.starred = true
      }
    }

    const { data: userCollections } = await supabase
      .from('collections')
      .select('collection_id')
      .neq('collection_name', 'Favorites') // Exclude Favorites
      .eq('user_id', userId)

    if (userCollections) {
      const { data: collItems } = await supabase
        .from('collection_items')
        .select('item_id')
        .in(
          'collection_id',
          userCollections.map((c) => c.collection_id),
        )
        .eq('item_type', 'artifact')
        .eq('item_id', route.params.id)

      if (collItems?.length > 0) {
        model.value.bookmarked = true
      }
    }
  }

  await modelStore.fetchStarCounts()
  await modelStore.fetchViewCounts()

  // ADDED: Wait for model to render & load
  nextTick(() => {
    if (artifactViewer.value) {
      artifactViewer.value.addEventListener('load', () => {
        defaultOrbit = artifactViewer.value.getAttribute('camera-orbit') || '0deg 75deg auto'
        defaultFOV = artifactViewer.value.getAttribute('field-of-view') || 'auto'
        defaultTarget = artifactViewer.value.getAttribute('camera-target') || 'auto'
      })
    }
  })
})

onUnmounted(() => {
  if (isSpeaking.value) {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }
})

function openLink(url) {
  window.open(url, '_blank')
}

// async function handleDelete() {
//   try {
//     console.log('Trying to soft-delete ID:', route.params.id)

//     // Fetch the original record
//     const { data: originalData, error: fetchError } = await supabase
//       .from('artifacts_metadata')
//       .select('*')
//       .eq('id', route.params.id)
//       .single()

//     if (fetchError) {
//       console.error('Error fetching original artifact:', fetchError)
//       alert('Failed to fetch the artifact.')
//       return
//     }

//     // Insert into deleted table
//     const { error: deleteError } = await supabase.from('deleted_artifacts').insert({
//       ...originalData,
//       deleted_at: new Date().toISOString(), // Add timestamp
//       deleted_by: user,
//     })

//     if (deleteError) {
//       console.error('Error deleting artifact:', deleteError)
//       alert('Failed to delete the artifact.')
//       return
//     }

//     // Delete the original record
//     const { error: delError } = await supabase
//       .from('artifacts_metadata')
//       .delete()
//       .eq('id', route.params.id)

//     if (delError) {
//       console.error('Error deleting artifact:', delError)
//       alert('Failed to delete the artifact.')
//       return
//     } else {
//       console.log('Artifact soft-deleted successfully:', route.params.id)
//       router.push('/artifacts')
//     }
//   } catch (err) {
//     console.error('Unexpected error during soft delete:', err)
//     alert('An unexpected error occurred.')
//   }
// }

async function handleDelete() {
  try {
    console.log('Trying to soft-delete ID:', route.params.id)

    // Fetch the original record
    const { data: originalData, error: fetchError } = await supabase
      .from('artifacts_metadata')
      .select('*')
      .eq('id', route.params.id)
      .single()

    if (fetchError) {
      console.error('Error fetching original artifact:', fetchError)
      alert('Failed to fetch the artifact.')
      return
    }

    // Insert into deleted table
    const { error: deleteError } = await supabase.from('deleted_artifacts').insert({
      ...originalData,
      deleted_at: new Date().toISOString(),
      deleted_by: user,
    })

    if (deleteError) {
      console.error('Error deleting artifact:', deleteError)
      alert('Failed to delete the artifact.')
      return
    }

    // Delete the original record
    const { error: delError } = await supabase
      .from('artifacts_metadata')
      .delete()
      .eq('id', route.params.id)

    if (delError) {
      console.error('Error deleting artifact:', delError)
      alert('Failed to delete the artifact.')
      return
    }

    await logItemHistory({
      itemId: route.params.id,
      itemType: 'artifact',
      action: 'delete',
      oldData: originalData,
      changes: { new: null, old: originalData },
    })

    console.log('Artifact soft-deleted successfully: ', route.params.id)
    router.push('/artifacts')
  } catch (err) {
    console.error('Unexpected error during soft delete:', err)
    alert('An unexpected error occurred.')
  }
}

async function logItemHistory({ itemId, itemType, action, oldData, changes }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.getUser()
    if (authError || !authData?.user) {
      console.error('Auth error:', authError)
      return
    }

    const adminName =
      `${userStore.profile?.first_name || ''} ${userStore.profile?.last_name || ''}`.trim()

    const { error } = await supabase.from('item_history').insert({
      item_id: itemId,
      item_type: itemType,
      action: action,
      performed_by: adminName || 'Admin',
      old_data: oldData,
      changes: changes,
    })

    if (error) {
      console.error('Error logging history:', error)
    } else {
      console.log('History logged successfully')
    }
  } catch (err) {
    console.error('Unexpected error logging history:', err)
  }
}
</script>

<style scoped>
/* Standard fullscreen */
model-viewer:fullscreen {
  background: radial-gradient(
    110.32% 94.3% at 50% 57.87%,
    #b69f9f 0%,
    #640c0c 51.92%,
    #121212 95.67%
  );
}

/* Webkit browsers (Safari, Chrome) */
model-viewer:-webkit-full-screen {
  background: radial-gradient(
    110.32% 94.3% at 50% 57.87%,
    #b69f9f 0%,
    #640c0c 51.92%,
    #121212 95.67%
  );
}

/* Firefox */
model-viewer:-moz-full-screen {
  background: radial-gradient(
    110.32% 94.3% at 50% 57.87%,
    #b69f9f 0%,
    #640c0c 51.92%,
    #121212 95.67%
  );
}

/* IE/Edge */
model-viewer:-ms-fullscreen {
  background: radial-gradient(
    110.32% 94.3% at 50% 57.87%,
    #b69f9f 0%,
    #640c0c 51.92%,
    #121212 95.67%
  );
}

.action-buttons {
  display: flex;
  align-items: center;
  color: #880000;
  font-family: 'Poppins', sans-serif !important;
  font-size: 16px !important;
  margin-left: 0;
  padding-left: 0;
  justify-content: flex-start;
  align-self: flex-start;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.artifact-detail-container {
  max-width: 1200px;
  margin: 0 auto;
}

.a-title {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 3.5rem;
  color: #560505;
  margin-top: 1rem;
  margin-left: 30rem;
}

.main-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.artifact-card {
  border-radius: 20px;
  background: radial-gradient(
    110.32% 94.3% at 50% 57.87%,
    #b69f9f 0%,
    #640c0c 51.92%,
    #121212 95.67%
  );
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  width: 706px;
  height: 630px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  position: relative;
}

.large-artifacts {
  width: 680px !important;
  height: 600px !important;
  border-radius: 8px;
}

/* Control Buttons Styles */
.control-buttons {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  gap: 8px;
  z-index: 10;
}

.control-btn {
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 50%;
  background-color: #757575;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.25));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.control-btn:hover {
  background-color: #616161;
  transform: translateY(-1px);
  filter: drop-shadow(0 6px 6px rgba(0, 0, 0, 0.3));
}

.control-btn:active {
  transform: translateY(0);
  filter: drop-shadow(0 2px 2px rgba(0, 0, 0, 0.25));
}

.control-icon {
  color: #d7d7d7 !important;
  font-size: 16px !important;
  object-fit: contain;
}

.info-section {
  flex: 1;
  max-width: 500px;
}

.top-actions {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
}

.a-info-title,
.a-info-title2 {
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  color: black;
  margin-bottom: 0.5rem;
}

.a-info-title {
  font-size: 18px;
}

.a-info-title2 {
  font-size: 16px;
}

.a-info-subtitle,
.a-info-text {
  font-family: 'Poppins', sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: black;
  line-height: 1.4;
}

.two-column-details,
.side-by-side-details {
  border-bottom: 1px solid #eee;
  padding-bottom: 1rem;
}

.detail-item {
  margin-bottom: 1.5rem;
}

.category-tag {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(204, 172, 0, 0.8), rgba(204, 172, 0, 0.6));
  color: #560505;
  font-weight: 600;
  border-radius: 5px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  box-shadow: 0 2px 8px rgba(204, 172, 0, 0.3);
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
}

.categories-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  width: 100%;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-left: -4px;
}

.categories-section {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1;
}

/* New styles for repositioned action icons */
.action-icons-top {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin-top: 0.25rem;
  margin-left: 0;
  padding-left: 0;
  justify-content: flex-start;
  align-self: flex-start;
}

.action-icons-top .action-icon {
  cursor: pointer;
  transition: color 0.3s ease;
  color: #7c7c7c;
}

.action-icons-top .bookmark-icon {
  cursor: pointer;
  transition: color 0.3s ease;
  color: #7c7c7c;
}

.action-icons-top .bookmark-icon:hover,
.action-icons-top .action-icon:hover {
  background-color: rgba(136, 0, 0, 0.1);
  border-radius: 4px;
  padding: 2px;
}

.action-icons-top,
.action-icons-top .star-icon.starred {
  color: #efaf00;
}

.icon-with-count {
  display: flex;
  align-items: center;
  gap: 0.21rem;
  font-family: 'Poppins', sans-serif;
}

.action-icons-top .count-text {
  font-size: 14px;
  font-weight: 500;
  color: #666;
  min-width: 20px;
  text-align: left;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25rem 0;
}

.detail-label {
  flex: 0 0 auto;
  min-width: 150px;
  text-align: left;
}

.detail-value {
  flex: 1;
  text-align: right;
}

/* Two-column details specific styles */
.two-column-details .detail-row {
  gap: 4rem;
  align-items: flex-start;
}

.two-column-details .detail-label,
.two-column-details .detail-value {
  flex: 1;
}

.two-column-details .detail-value .a-info-title2,
.two-column-details .detail-value .a-info-subtitle {
  text-align: left;
}

.func-button {
  display: flex !important;
  justify-content: flex-end !important;
  align-items: center !important;
  margin-top: 2rem !important;
  padding-top: 1rem !important;
  border-top: 1px solid #eee !important;
  width: 100% !important;
  clear: both !important;
}

.func-button .func-btn {
  color: #fbf4d0 !important;
  background: #880000 !important;
  border-radius: 5px !important;
  transition: all 0.3s ease !important;
  font-family: 'Poppins', sans-serif !important;
  font-weight: 600 !important;
  width: 100px !important;
  min-height: auto !important;
  padding: 8px 16px !important;
  margin-left: auto !important;
}

.func-button .func-btn:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2) !important;
}

/* Ensure the router-link doesn't interfere */
.func-button a {
  text-decoration: none !important;
  display: inline-block !important;
}

.help-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.help-content {
  background: rgba(20, 20, 20, 0.8);
  border-radius: 12px;
  padding: 1.5rem;
  width: 85%;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  position: relative;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.help-close-btn {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #f5f5f5;
}

.help-close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}

.help-title {
  font-family: 'Poppins', sans-serif;
  font-size: 24px;
  font-weight: 600;
  color: whitesmoke;
  text-align: center;
  margin-bottom: 2rem;
  padding-right: 2rem;
}

.help-sections {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.help-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.help-section-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Poppins', sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #f5f5f5;
  margin-bottom: 1rem;
}

.help-icon {
  color: #e8e8e8;
  font-size: 20px;
}

.help-methods {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.help-method {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: #e0e0e0;
  padding: 0.4rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.method-icon {
  color: #e8e8e8;
  font-size: 14px;
  flex-shrink: 0;
}

.help-divider {
  text-align: center;
  font-family: 'Poppins', sans-serif;
  font-size: 10px;
  font-weight: 400;
  color: #b0b0b0;
  font-style: italic;
  margin: 0.15rem 0;
}

/* Base responsive container improvements */
.artifact-detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.main-content {
  display: flex;
  gap: 2rem;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
}

.info-section {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

/* ========================
  RESPONSIVE DESIGN
======================== */

/* Desktop - 1300px and below */
@media screen and (max-width: 1300px) {
  .a-title {
    margin-left: 15rem;
    font-size: 3.2rem;
  }

  /* Improve two-column layouts */
  .two-column-details .detail-row {
    gap: 2rem;
  }

  .two-column-details .detail-label,
  .two-column-details .detail-value {
    flex: 1;
    min-width: 0;
    max-width: 48%;
  }

  .side-by-side-details .detail-row {
    gap: 2rem;
  }

  .side-by-side-details .detail-label,
  .side-by-side-details .detail-value {
    flex: 1;
    min-width: 0;
    max-width: 48%;
  }
}

/* Desktop - 1199px and below */
@media screen and (max-width: 1199px) {
  .artifact-card {
    width: 500px;
    height: 500px;
  }

  .large-artifacts {
    width: 470px !important;
    height: 470px !important;
  }

  .info-section {
    max-width: none;
    flex: 1;
    min-width: 0;
  }

  .a-title {
    margin-top: 3rem;
    font-size: 3rem;
    margin-left: 5rem;
  }

  .main-content {
    gap: 1.5rem;
  }

  /* Tighten column gaps */
  .two-column-details .detail-row,
  .side-by-side-details .detail-row {
    gap: 1.5rem;
  }
}

/* Large Tablet - 1068px and below */
@media screen and (max-width: 1068px) {
  .artifact-card {
    width: 450px;
    height: 450px;
  }

  .large-artifacts {
    width: 420px !important;
    height: 420px !important;
  }

  .a-title {
    margin-left: 2rem;
    font-size: 2.8rem;
  }

  .main-content {
    gap: 1rem;
  }

  .info-section {
    flex: 1;
    min-width: 0;
    max-width: none;
  }

  /* Adjust column gaps */
  .two-column-details .detail-row,
  .side-by-side-details .detail-row {
    gap: 1rem;
  }
}

/* Tablet - 991px and below */
@media screen and (max-width: 991px) {
  .main-content {
    flex-direction: column;
    align-items: center;
    gap: 2rem;
  }

  .artifact-card {
    width: 100%;
    max-width: 600px;
    height: 450px;
  }

  .large-artifacts {
    width: 90% !important;
    height: 400px !important;
    max-width: 570px !important;
  }

  .info-section {
    max-width: 100%;
    width: 100%;
  }

  .a-title {
    font-size: 48px;
    margin-left: 0;
    text-align: center;
  }

  .control-buttons {
    bottom: 15px;
    right: 15px;
  }

  /* Maintain two-column layout on tablet */
  .two-column-details .detail-row,
  .side-by-side-details .detail-row {
    gap: 2rem;
  }

  .two-column-details .detail-label,
  .two-column-details .detail-value,
  .side-by-side-details .detail-label,
  .side-by-side-details .detail-value {
    flex: 1;
    min-width: 0;
  }
}

/* Tablet Small - 767px and below */
@media screen and (max-width: 767px) {
  .artifact-card {
    max-width: 500px;
    height: 400px;
  }

  .large-artifacts {
    width: 90% !important;
    height: 350px !important;
  }

  .control-buttons {
    gap: 6px;
  }

  .control-btn {
    width: 28px;
    height: 28px;
  }

  .control-icon {
    font-size: 14px !important;
  }

  .top-actions {
    flex-direction: column;
    align-items: flex-start;
  }

  .categories-container {
    align-items: flex-start;
  }

  .a-title {
    font-size: 36px;
    margin-left: 0;
    text-align: center;
  }

  .func-button {
    justify-content: center !important;
    margin-top: 1rem !important;
  }

  /* Stack two-column details on smaller screens */
  .two-column-details .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .two-column-details .detail-label,
  .two-column-details .detail-value {
    flex: none;
    width: 100%;
  }

  .two-column-details .detail-value .a-info-title2,
  .two-column-details .detail-value .a-info-subtitle {
    text-align: left;
  }

  /* Stack side-by-side details too */
  .side-by-side-details .detail-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .side-by-side-details .detail-label,
  .side-by-side-details .detail-value {
    flex: none;
    width: 100%;
    text-align: left;
  }
}

/* Mobile - 575px and below */
@media screen and (max-width: 575px) {
  .artifact-card {
    width: calc(100% - 1rem);
    height: 350px;
    padding: 0.5rem;
    margin: 0 0.5rem;
  }

  .large-artifacts {
    width: 280px !important;
    height: 280px !important;
  }

  .a-title {
    font-size: 28px;
    padding: 12px 0;
  }

  .control-buttons {
    bottom: 10px;
    right: 10px;
    gap: 4px;
  }

  .control-btn {
    width: 26px;
    height: 26px;
  }

  .control-icon {
    font-size: 12px !important;
  }

  .category-tag {
    font-size: 0.7rem;
    padding: 0.3rem 0.6rem;
  }

  .func-button .func-btn {
    font-size: 14px !important;
    width: 80px !important;
    padding: 6px 12px !important;
  }

  /* Ensure mobile layout is fully stacked */
  .detail-row {
    gap: 0.25rem;
  }
}

/* Help overlay responsiveness improvements */
@media (max-width: 768px) {
  .help-content {
    padding: 1.5rem;
    margin: 1rem;
    max-height: 85%;
    width: 90%;
  }

  .help-title {
    font-size: 20px;
    margin-bottom: 1.5rem;
    padding-right: 2rem;
  }

  .help-sections {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .help-section {
    padding: 1rem;
  }

  .help-section-title {
    font-size: 16px;
    margin-bottom: 0.75rem;
  }

  .help-method {
    font-size: 13px;
    padding: 0.4rem;
  }

  .method-icon {
    font-size: 16px;
  }
}
</style>
