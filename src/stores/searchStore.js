import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    type: '',
    results: [],
  }),
  actions: {
    async search(query, type) {
      this.query = query
      this.type = type

      const table = this.type === 'documents' ? 'documents_metadata' : 'artifacts_metadata'

      let data, error
      const response = await supabase
        .from(table)
        .select(
          type === 'documents'
            ? 'id, file_name, file_url, preview_url, metadata, uploaded_at, updated_at'
            : 'id, file_name, file_url, metadata, uploaded_at, updated_at',
        )
        .ilike('search_text', `%${query}%`)

      data = response.data
      error = response.error

      if (error) {
        console.error(`Search error in ${this.type}:`, error)
        this.results = []
      } else {
        this.results = data
      }

      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id

      // Fetch Favorites collection items
      const { data: favoritesCollection, error: favError } = await supabase
        .from('collections')
        .select('collection_id')
        .eq('user_id', userId)
        .eq('collection_name', 'Favorites')
        .maybeSingle()

      if (favError) {
        console.error('Error fetching favorite items:', favError)
      }

      let favoriteIds = []

      if (favoritesCollection) {
        const { data: favItems, error: favItemsError } = await supabase
          .from('collection_items')
          .select('item_id')
          .eq('collection_id', favoritesCollection.collection_id)
          .eq('item_type', this.type === 'documents' ? 'document' : 'artifact')

        if (!favItemsError) {
          favoriteIds = favItems.map((i) => i.item_id)
        }
      }

      this.results = data.map((item) => ({
        ...item,
        starred: favoriteIds.includes(item.id),
      }))
    },

    clear() {
      this.query = ''
      this.results = []
    },
  },
})
