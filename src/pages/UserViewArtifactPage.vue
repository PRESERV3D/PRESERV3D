<template>
  <q-page class="q-pa-md">
    <router-link to="/artifacts" class="back-button-top">
      <q-btn flat icon="arrow_back" label="Back to Artifacts" />
    </router-link>

    <div v-if="model" class="artifact-detail-container">
      <!-- Artifact Name/Title at the top -->
      <h2 class="a-title q-mb-lg">{{ model.metadata.title }}</h2>

      <div class="main-content">
        <!-- Left Side: 3D Model Viewer Card -->
        <div class="artifact-card">
          <model-viewer
            :src="model.file_url"
            camera-controls
            loading="lazy"
            auto-rotate
            auto-rotate-delay="1500"
            rotation-per-second="10deg"
            shadow-intensity="1"
            class="large-artifacts"
          />
        </div>

        <!-- Right Side: Information Panel -->
        <div class="info-section">
          <!-- Category Tag and Action Icons -->
          <div class="top-actions q-mb-lg">
            <div class="categories-container">
              <!-- Show categories if they exist, otherwise show fallback -->
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

              <!-- Action icons  -->
              <div class="action-icons">
                <q-icon
                  :name="model.bookmarked ? 'bookmark' : 'bookmark_border'"
                  class="bookmark-icon q-mr-md"
                  :class="{ bookmarked: model.bookmarked }"
                  size="sm"
                  @click.stop="toggleBookmark(model.id)"
                />

                <q-icon
                  :name="model.starred ? 'star' : 'star_border'"
                  class="star-icon"
                  :class="{ starred: model.starred }"
                  size="sm"
                  @click.stop="toggleStar(model.id)"
                />
              </div>
            </div>
          </div>

          <!-- Summary Section -->
          <div class="summary-section q-mb-md">
            <h6 class="a-info-title q-mb-sm q-mt-sm">Summary</h6>
            <p class="a-info-text">{{ model.metadata.summary }}</p>
          </div>

          <!-- WEBSCRAPE -->
          <!-- Reference Link
            <div class="reference-section q-mb-lg">
              <a href="#" class="reference-link text-primary">
                <q-icon name="link" class="q-mr-xs" />
                Show Reference Links
              </a>
            </div> -->

          <!-- Two-Column Section -->
          <div class="two-column-details q-mb-lg">
            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="a-info-title2">Presented To</div>
                <div class="a-info-subtitle">[Recipient's Name]</div>
              </div>
              <div class="detail-value">
                <div class="a-info-title2">Awarded By</div>
                <div class="a-info-subtitle">[Awardee's Name]</div>
              </div>
            </div>

            <div class="detail-row q-mb-md">
              <div class="detail-label">
                <div class="a-info-title2">Object of Study</div>
                <div class="a-info-subtitle">Information Technology</div>
              </div>
              <div class="detail-value">
                <div class="a-info-title2">Date Awarded</div>
                <div class="a-info-subtitle">May 18. 2024</div>
              </div>
            </div>

            <!-- Single Column Section -->
            <div class="detail-item q-mb-md">
              <div class="a-info-title2">Data Source</div>
              <div class="a-info-subtitle">Student Affairs and Recognition Committee</div>
            </div>

            <!-- USER: Info with side-by-side layout -->
            <div class="side-by-side-details q-mb-lg">
              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Donated/Loaned By:</div>
                </div>
                <div class="detail-value">
                  <div class="a-info-subtitle">{{ model.donated_by || '[Donor/Lender Name]' }}</div>
                </div>
              </div>

              <div class="detail-row q-mb-md">
                <div class="detail-label">
                  <div class="a-info-title2">Date Received:</div>
                </div>
                <div class="detail-value">
                  <div class="a-info-subtitle">
                    {{ formatDate(model.date_received || model.uploaded_at) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="loading-container">
      <q-spinner size="xl" />
    </div>
  </q-page>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useModelStore } from 'stores/modelStore'
import '@google/model-viewer'

const route = useRoute()
const modelStore = useModelStore()

function formatDate(dateStr) {
  const date = new Date(dateStr)
  const formatted = `${date.toLocaleDateString('en-CA')} ${date.toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })}`
  return formatted
}

const model = computed(() => modelStore.models.find((model) => model.id == route.params.id))

const toggleBookmark = (modelId) => {
  const model = modelStore.models.find((m) => m.id === modelId)
  if (model) {
    model.bookmarked = !model.bookmarked
  }
}

const toggleStar = (modelId) => {
  const model = modelStore.models.find((m) => m.id === modelId)
  if (model) {
    model.starred = !model.starred
  }
}
</script>
