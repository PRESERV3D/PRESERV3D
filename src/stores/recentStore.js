import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'
import { convertToWorkingUrl } from 'src/composables/useR2Url'

export const useRecentStore = defineStore('recent', {
  state: () => ({
    recentItems: [],
  }),

  actions: {
    async fetchRecentUploads(limit = 10) {
      try {
        const [artifactsRes, documentsRes] = await Promise.all([
          supabase
            .from('artifacts_metadata')
            .select('id, file_name, file_url, metadata, uploaded_at')
            .order('uploaded_at', { ascending: false }),

          supabase
            .from('documents_metadata')
            .select('id, file_name, file_url, preview_url, metadata, uploaded_at')
            .order('uploaded_at', { ascending: false }),
        ])

        if (artifactsRes.error || documentsRes.error) {
          console.error('Error fetching uploads:', artifactsRes.error || documentsRes.error)
          return
        }

        const combined = [
          ...artifactsRes.data.map((item) => ({ ...item, type: 'artifact' })),
          ...documentsRes.data.map((item) => ({ ...item, type: 'document' })),
        ]

        const sorted = combined
          .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
          .slice(0, limit)

        // Convert URLs to presigned URLs
        this.recentItems = await Promise.all(
          sorted.map(async (item) => {
            let workingUrl = item.file_url
            let workingPreviewUrl = item.preview_url

            try {
              if (item.file_url) {
                workingUrl = await convertToWorkingUrl(item.file_url)
              }
              if (item.preview_url) {
                workingPreviewUrl = await convertToWorkingUrl(item.preview_url)
              }
            } catch (err) {
              console.warn('Could not convert URL for recent item:', item.id, err)
            }

            return {
              ...item,
              file_url: workingUrl,
              preview_url: workingPreviewUrl,
            }
          }),
        )
      } catch (error) {
        console.error('Failed to fetch recent uploads:', error)
      }
    },
  },
})
