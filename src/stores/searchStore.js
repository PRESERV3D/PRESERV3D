import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    type: '',
    results: [],
    favoriteIds: [],
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

      // Call fetch favorites function to get favorite item IDs
      const favoriteIds = await this.fetchFavorites(type)

      this.results = data.map((item) => ({
        ...item,
        starred: favoriteIds.includes(item.id),
      }))
    },
    async fetchFavorites(type) {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) return []

      // Fetch favorites collection
      const { data: favoritesCollection, error: favError } = await supabase
        .from('collections')
        .select('collection_id')
        .eq('user_id', userId)
        .eq('collection_name', 'Favorites')
        .maybeSingle()

      if (favError || !favoritesCollection) {
        console.error('Error fetching favorites collection:', favError)
        return []
      }

      // Get favorite item IDs
      const { data: favItems, error: favItemsError } = await supabase
        .from('collection_items')
        .select('item_id')
        .eq('collection_id', favoritesCollection.collection_id)
        .eq('item_type', type === 'documents' ? 'document' : 'artifact')

      if (!favItemsError) {
        return favItems.map((item) => item.item_id)
      } else {
        console.error('Error fetching favorite items:', favItemsError)
        return []
      }
    },

    async clear() {
      this.query = ''
      this.results = []

      await this.fetchFavorites(this.type)
    },
  },
})
