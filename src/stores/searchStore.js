import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

function fieldToColumn(field) {
  switch (field) {
    case 'general':
      return 'search_text'
    case 'title':
      return 'metadata->>title'
    case 'author':
      return 'metadata->>author'
    case 'summary':
      return 'metadata->>summary'
    case 'keywords':
      return 'metadata->>keywords'
    case 'date':
      return 'metadata->>date'
    default:
      return 'search_text'
  }
}

export const allSortOptions = [
  { label: 'Relevance', value: { sortBy: 'relevance', sortOrder: null } },
  { label: 'Title A-Z', value: { sortBy: 'title', sortOrder: 'asc' } },
  { label: 'Title Z-A', value: { sortBy: 'title', sortOrder: 'desc' } },
  { label: 'Date Uploaded (Newest First)', value: { sortBy: 'uploaded', sortOrder: 'desc' } },
  { label: 'Date Uploaded (Oldest First)', value: { sortBy: 'uploaded', sortOrder: 'asc' } },
  { label: 'Date Modified (Newest First)', value: { sortBy: 'updated', sortOrder: 'desc' } },
  { label: 'Date Modified (Oldest First)', value: { sortBy: 'updated', sortOrder: 'asc' } },
  { label: 'Origin Date (Newest First)', value: { sortBy: 'origin', sortOrder: 'desc' } },
  { label: 'Origin Date (Oldest First)', value: { sortBy: 'origin', sortOrder: 'asc' } },
]

export const useSearchStore = defineStore('search', {
  state: () => ({
    query: '',
    type: '',
    searchedDocuments: [],
    searchedModels: [],
    favoriteIds: [],
    sortBy: 'uploaded',
    sortOrder: 'desc',
    allSortOptions,
  }),
  actions: {
    setSort({ sortBy, sortOrder }) {
      this.sortBy = sortBy
      this.sortOrder = sortOrder
    },
    getSortLabel(allSortOptions) {
      const found = allSortOptions.find(
        (opt) => opt.value.sortBy === this.sortBy && opt.value.sortOrder === this.sortOrder,
      )
      return found ? found.label : 'Sort'
    },
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

      // Exact phrase search on all text (wrapped in "")
      const exactMatch = query.match(/"(.*?)"/)
      if (exactMatch) {
        supabaseQuery = supabaseQuery.ilike('search_text', `%${exactMatch[1]}%`)
      }

      // Boolean AND
      else if (query.includes('AND')) {
        const terms = query.split('AND').map((t) => t.trim())
        for (const term of terms) {
          supabaseQuery = supabaseQuery.ilike('search_text', `%${term}%`)
        }
      }

      // Boolean OR
      else if (query.includes('OR')) {
        const terms = query.split('OR').map((t) => t.trim())
        const orConditions = terms.map((term) => `search_text.ilike.%${term}%`).join(',')
        supabaseQuery = supabaseQuery.or(orConditions)
      }

      // "intitle: keyword" on search field (matches exact word only on metadata.title)
      else if (query.includes('intitle:')) {
        const titleTerm = query.match(/intitle:([^\n\r]+)/)?.[1]?.trim()
        if (titleTerm) {
          // OR condition to match exact word with spaces, punctuation, or at boundaries
          const orConditions = [
            `metadata->>title.ilike.${titleTerm} %`, // Word at start
            `metadata->>title.ilike.% ${titleTerm}`, // Word at end
            `metadata->>title.ilike.% ${titleTerm} %`, // Word in middle
            `metadata->>title.eq.${titleTerm}`, // Exact match (single word)
          ].join(',')
          supabaseQuery = supabaseQuery.or(orConditions)
        }
      }

      // "author: keyword" (matches any author with the keyword on metadata.author)
      else if (query.includes('author:')) {
        const authorTerm = query.match(/author:([^\n\r]+)/)?.[1]?.trim()
        if (authorTerm) {
          supabaseQuery = supabaseQuery.ilike('metadata->>author', `%${authorTerm}%`)
        }
      }

      // Date search range (e.g. 2020...2023 / YYYY-MM-DD...YYYY-MM-DD) on metadata.date
      else if (query.match(/\d{4}(-\d{2}-\d{2})?\.\.\.\d{4}(-\d{2}-\d{2})?/)) {
        let [start, end] = query.split('...')

        // If only year given, expand to start and end of year
        if (/^\d{4}$/.test(start)) start = `${start}-01-01`
        if (/^\d{4}$/.test(end)) end = `${end}-12-31`

        supabaseQuery = supabaseQuery.gte('metadata->>date', start).lte('metadata->>date', end)
      }

      // Truncation search type (matches word stems on all text)
      else if (query.endsWith('*')) {
        const stem = query.slice(0, -1)
        supabaseQuery = supabaseQuery.ilike('search_text', `%${stem}%`)
      }

      // Fallback to exact word match on search_text
      else {
        // OR condition to match exact word with spaces, punctuation, or at boundaries
        const orConditions = [
          `search_text.ilike.${query} %`, // Word at start
          `search_text.ilike.% ${query}`, // Word at end
          `search_text.ilike.% ${query} %`, // Word in middle
          `search_text.eq.${query}`, // Exact match (single word)
        ].join(',')
        supabaseQuery = supabaseQuery.or(orConditions)
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

      // Fetch favorites and bookmarks
      const [favoriteIds, bookmarkedIds] = await Promise.all([
        this.fetchFavorites(type),
        this.fetchBookmarks(type),
      ])

      // Attach starred and bookmarked flags
      const searched = data.map((item) => ({
        ...item,
        starred: favoriteIds.includes(item.id),
        bookmarked: bookmarkedIds.includes(item.id),
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

    async fetchBookmarks(type) {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData?.user?.id
      if (!userId) return []

      // Fetch all user collections
      const { data: allUserCollections, error: allCollError } = await supabase
        .from('collections')
        .select('collection_id, collection_name')
        .eq('user_id', userId)

      if (allCollError || !allUserCollections) {
        console.error('Error fetching user collections:', allCollError)
        return []
      }

      // Get bookmarked item IDs from non-Favorites collections
      const nonFavoritesCollections = allUserCollections.filter(
        (col) => col.collection_name !== 'Favorites',
      )

      if (nonFavoritesCollections.length === 0) {
        return []
      }

      const collectionIds = nonFavoritesCollections.map((col) => col.collection_id)

      const { data: bookmarkedItems, error: bookmarkError } = await supabase
        .from('collection_items')
        .select('item_id')
        .in('collection_id', collectionIds)
        .eq('item_type', type === 'documents' ? 'document' : 'artifact')

      if (!bookmarkError && bookmarkedItems) {
        return [...new Set(bookmarkedItems.map((item) => item.item_id))]
      } else {
        console.error('Error fetching bookmarked items:', bookmarkError)
        return []
      }
    },

    async clear() {
      console.log('[Store.clear] Clearing search state...')

      this.query = ''
      this.searchedModels = []
      this.searchedDocuments = []
      console.log('[Store.clear] State cleared. Type is:', this.type)
    },
    async clearAll() {
      console.log('[Store.clearAll] Hard clearing all search data...')
      this.query = ''
      this.searchedDocuments = []
      this.searchedModels = []
      this.type = ''
    },
    sortSettings(sort) {
      switch (sort) {
        case 'Relevance':
          return { field: 'relevance', order: null }
        case 'Title A-Z':
          return { field: 'title', order: 'asc' }
        case 'Title Z-A':
          return { field: 'title', order: 'desc' }
        case 'Date Uploaded (Newest First)':
          return { field: 'uploaded_at', order: 'desc' }
        case 'Date Uploaded (Oldest First)':
          return { field: 'uploaded_at', order: 'asc' }
        case 'Date Modified (Newest First)':
          return { field: 'updated_at', order: 'desc' }
        case 'Date Modified (Oldest First)':
          return { field: 'updated_at', order: 'asc' }
        case 'Origin Date (Newest First)':
          return { field: 'origin', order: 'desc' }
        case 'Origin Date (Oldest First)':
          return { field: 'origin', order: 'asc' }
        default:
          return { field: 'uploaded_at', order: 'desc' }
      }
    },
    sortResults(results) {
      const { sortBy, sortOrder } = this

      if (sortBy === 'relevance') return

      const getValue = (item) => {
        switch (sortBy) {
          case 'title':
            return (item.metadata?.title || '').trim().toLowerCase()
          case 'uploaded':
            return new Date(item.uploaded_at || 0)
          case 'updated':
            return new Date(item.updated_at || 0)
          case 'origin':
            return new Date(item.metadata?.date || 0)
          default:
            return 0
        }
      }

      return [...results].sort((a, b) => {
        const valA = getValue(a)
        const valB = getValue(b)

        if (sortBy === 'title') {
          return valA.localeCompare(valB) * (sortOrder === 'asc' ? 1 : -1)
        } else {
          return (valA - valB) * (sortOrder === 'asc' ? 1 : -1)
        }
      })
    },
    async fetchCategories(type) {
      if (!['documents', 'artifacts'].includes(type)) {
        return []
      }

      const table = type === 'documents' ? 'documents_metadata' : 'artifacts_metadata'
      const { data, error } = await supabase.from(table).select('metadata')

      if (error) {
        console.error(`Error fetching categories from ${table}:`, error)
        return []
      }

      const categories = new Map()

      data.forEach((row) => {
        const meta = row.metadata
        if (meta && Array.isArray(meta.categories)) {
          meta.categories.forEach((cat) => {
            const trimmed = cat.trim()
            if (!categories.has(trimmed)) {
              categories.set(trimmed, trimmed) // Exact value for both key & label
            }
          })
        }
      })

      return Array.from(categories.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label))
    },

    async advancedSearch(params) {
      this.query = params.query
      this.type = params.type

      const table = params.type === 'documents' ? 'documents_metadata' : 'artifacts_metadata'

      let supabaseQuery = supabase
        .from(table)
        .select(
          params.type === 'documents'
            ? 'id, file_name, file_url, preview_url, metadata, uploaded_at, updated_at, uploaded_by, search_text'
            : 'id, file_name, file_url, metadata, uploaded_at, updated_at, search_text, data_source, donated_by, date_received',
        )

      const column = fieldToColumn(params.field)
      console.log('[AdvancedSearch] Using field:', params.field, '→ column:', column)

      // Handle match types
      if (params.query && column) {
        if (params.matchType === 'exactMatch') {
          supabaseQuery = supabaseQuery.filter(column, 'ilike', params.query)
        } else if (params.matchType === 'anyWords') {
          const words = params.query.split(/\s+/)
          const orConditions = words.map((w) => `${column}.ilike.%${w}%`).join(',')
          supabaseQuery = supabaseQuery.or(orConditions)
        } else if (params.matchType === 'allWords') {
          const words = params.query.split(/\s+/)
          words.forEach((w) => {
            supabaseQuery = supabaseQuery.filter(column, 'ilike', `%${w}%`)
          })
        } else if (params.matchType === 'noneOfWords') {
          const words = params.query.split(/\s+/)
          words.forEach((w) => {
            supabaseQuery = supabaseQuery.filter(column, 'not.ilike', `%${w}%`)
          })
        }
      }
      // Origin Date
      if (params.dateRange?.from) {
        supabaseQuery = supabaseQuery.gte('metadata->>date', params.dateRange.from)
      }
      if (params.dateRange?.to) {
        supabaseQuery = supabaseQuery.lte('metadata->>date', params.dateRange.to)
      }

      // Categories
      if (params.categories?.length) {
        const validCategories = params.categories.filter((cat) => cat !== 'All')

        if (validCategories.length > 0) {
          const orConditions = validCategories
            .map((cat) => `metadata->categories.cs.["${cat}"]`) // Exact match
            .join(',')

          console.log('[AdvancedSearch] Category filter OR:', orConditions)
          supabaseQuery = supabaseQuery.or(orConditions)
        }
      }

      // Sorting
      const sortMapping = {
        title: 'metadata->>title',
        uploaded: 'uploaded_at',
        updated: 'updated_at',
        origin: 'metadata->>date',
      }

      if (this.sortBy && this.sortBy !== 'relevance') {
        const sortColumn = sortMapping[this.sortBy] || this.sortBy
        const ascending = this.sortOrder === 'asc'
        supabaseQuery = supabaseQuery.order(sortColumn, { ascending })
      }

      // Perform query
      let data, error
      try {
        console.log('[AdvancedSearch] Running query...')
        const response = await supabaseQuery
        data = response.data
        error = response.error
        console.log('[AdvancedSearch] Raw response:', data, error)
      } catch (err) {
        console.error('[AdvancedSearch] Fatal error:', err)
        return
      }

      if (error) {
        console.error(`[AdvancedSearch] Error in ${this.type}:`, error)
        if (params.type === 'documents') {
          this.searchedDocuments = []
        } else {
          this.searchedModels = []
        }
        return
      }

      if (!data || data.length === 0) {
        console.warn('[AdvancedSearch] No results found.')
        if (params.type === 'documents') this.searchedDocuments = []
        else this.searchedModels = []
        return
      }

      // Fetch favorites and bookmarks
      const [favoriteIds, bookmarkedIds] = await Promise.all([
        this.fetchFavorites(params.type),
        this.fetchBookmarks(params.type),
      ])

      const searched = data.map((item) => ({
        ...item,
        starred: favoriteIds.includes(item.id),
        bookmarked: bookmarkedIds.includes(item.id),
      }))

      if (params.type === 'documents') {
        this.searchedDocuments = searched
        this.sortResults(this.searchedDocuments)
      } else {
        this.searchedModels = searched
        this.sortResults(this.searchedModels)
      }

      console.log('[AdvancedSearch] Results:', searched)
    },
  },
})
