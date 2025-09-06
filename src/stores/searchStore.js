import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    type: '',
    searchedDocuments: [],
    searchedModels: [],
    favoriteIds: [],
    sortOption: 'Newest',
  }),
  actions: {
    async search(query, type) {
      this.query = query
      this.type = type

      const table = type === 'documents' ? 'documents_metadata' : 'artifacts_metadata'
      let supabaseQuery = supabase
        .from(table)
        .select(
          type === 'documents'
            ? 'id, file_name, file_url, preview_url, metadata, uploaded_at, updated_at, uploaded_by, search_text'
            : 'id, file_name, file_url, metadata, uploaded_at, updated_at, search_text, data_source, donated_by, date_received',
        )

      // exact phrase search on all text (wrapped in "") - working
      const exactMatch = query.match(/"(.*?)"/)
      if (exactMatch) {
        supabaseQuery = supabaseQuery.ilike('search_text', `%${exactMatch[1]}%`)
      }

      // boolean AND - working
      else if (query.includes('AND')) {
        const terms = query.split('AND').map((t) => t.trim())
        for (const term of terms) {
          supabaseQuery = supabaseQuery.ilike('search_text', `%${term}%`)
        }
      }

      // boolean OR - working
      else if (query.includes('OR')) {
        const terms = query.split('OR').map((t) => t.trim())
        const orConditions = terms.map((term) => `search_text.ilike.%${term}%`).join(',')
        supabaseQuery = supabaseQuery.or(orConditions)
      }

      // intitle: keyword (matches exact word on metadata.title) - with spaces working but words should be next to each other / not working for word in different order
      else if (query.includes('intitle:')) {
        const titleTerm = query.match(/intitle:([^\n\r]+)/)?.[1]?.trim()
        if (titleTerm) {
          supabaseQuery = supabaseQuery.ilike('metadata->>title', `%${titleTerm}%`)
        }
      }

      // author: keyword (matches any author with the keyword on metadata.author) - working
      else if (query.includes('author:')) {
        const authorTerm = query.match(/author:([^\n\r]+)/)?.[1]?.trim()
        if (authorTerm) {
          supabaseQuery = supabaseQuery.ilike('metadata->>author', `%${authorTerm}%`)
        }
      }

      // date search range (e.g. 2020...2023 / YYYY-MM-DD...YYYY-MM-DD) on metadata.date - working
      else if (query.match(/\d{4}(-\d{2}-\d{2})?\.\.\.\d{4}(-\d{2}-\d{2})?/)) {
        let [start, end] = query.split('...')

        // if only year given, expand to start and end of year
        if (/^\d{4}$/.test(start)) start = `${start}-01-01`
        if (/^\d{4}$/.test(end)) end = `${end}-12-31`

        supabaseQuery = supabaseQuery.gte('metadata->>date', start).lte('metadata->>date', end)
      }

      // truncation (e.g. objecti*) → match word stems - working all text including summary tho working on "objecti" "*objecti"
      else if (query.endsWith('*')) {
        const stem = query.slice(0, -1)
        supabaseQuery = supabaseQuery.ilike('search_text', `%${stem}%`)
      }

      // Fallback to default ilike match - working but words should be next to each other
      else {
        supabaseQuery = supabaseQuery.ilike('search_text', `%${query}%`)
      }

      const { data, error } = await supabaseQuery

      if (error) {
        console.error(`Search error in ${this.type}:`, error)
        if (type === 'documents') {
          this.searchedDocuments = []
        } else {
          this.searchedModels = []
        }
      }

      // Fetch favorites
      const favoriteIds = await this.fetchFavorites(type)

      // Attach starred flag
      const searched = data.map((item) => ({
        ...item,
        starred: favoriteIds.includes(item.id),
      }))

      if (type === 'documents') {
        this.searchedDocuments = searched
        if (this.sortOption) this.sortResults(this.sortOption, this.searchedDocuments)
      } else {
        this.searchedModels = searched
        if (this.sortOption) this.sortResults(this.sortOption, this.searchedModels)
      }
    },

    async fetchFavorites(type) {
      // need update star color after star on searched item clicked clear search
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
      this.searchedModels = []
      this.searchedDocuments = []

      await this.fetchFavorites(this.type)
    },
    sortSettings(sort) {
      switch (sort) {
        case 'Newest':
          return { field: 'uploaded_at', order: 'desc' }
        case 'Oldest':
          return { field: 'uploaded_at', order: 'asc' }
        case 'Title A-Z':
          return { field: 'title', order: 'asc' }
        case 'Title Z-A':
          return { field: 'title', order: 'desc' }
        default:
          return { field: null, order: 'asc' }
      }
    },
    sortResults(sort, resultArray) {
      this.sortOption = sort
      console.log('Sorting search results by:', sort)

      const { field, order } = this.sortSettings(sort)
      if (!field) return

      const getValue = (item) => {
        if (field === 'title') return (item.metadata?.title || '').trim().toLowerCase()
        if (field === 'uploaded_at') return new Date(item.uploaded_at || 0)
        return item[field]
      }

      resultArray.sort((a, b) => {
        const valA = getValue(a)
        const valB = getValue(b)

        if (field === 'title')
          return (
            valA.localeCompare(valB, undefined, { sensitivity: 'base' }) *
            (order === 'asc' ? 1 : -1)
          )
        if (field === 'uploaded_at') return (valA - valB) * (order === 'asc' ? 1 : -1)

        return 0
      })
    },
  },
})
