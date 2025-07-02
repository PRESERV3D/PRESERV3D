import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    type: 'artifacts',
    results: [],
  }),
  actions: {
    async search(query, type) {
      this.query = query
      this.type = type

      const table = this.type === 'documents' ? 'documents_metadata' : 'artifacts_metadata'

      const { data, error } = await supabase
        .from(table)
        .select('id, file_name, file_url, metadata, uploaded_at, updated_at')
        .ilike('search_text', `%${query}%`)

      if (error) {
        console.error(`Search error in ${this.type}:`, error)
        this.results = []
      } else {
        this.results = data
      }
    },

    clear() {
      this.query = ''
      this.results = []
    },
  },
})
