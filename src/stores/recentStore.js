import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

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

        this.recentItems = combined
          .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at))
          .slice(0, limit)
      } catch (error) {
        console.error('Failed to fetch recent uploads:', error)
      }
    },
  },
})
