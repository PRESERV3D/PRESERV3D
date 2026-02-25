import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useDocumentsStore = defineStore('documentsStore', {
  state: () => ({
    documents: [],
    filteredDocuments: [],
    viewCounts: {}, // { [id]: views }
    starCounts: {}, // { [id]: star_count }
  }),
  actions: {
    setDocuments(docs) {
      this.documents = docs
      this.filteredDocuments = docs
    },
    addDocument(doc) {
      this.documents.push(doc)
    },
    updateStarCount(itemId, newCount) {
      this.starCounts[itemId] = newCount
    },
    async fetchViewCounts() {
      const { data, error } = await supabase.from('documents_view').select('id, views')

      if (error) {
        console.error('Error fetching view counts:', error)
        return
      }

      // Build a lookup map: { id: count }
      this.viewCounts = data.reduce((acc, row) => {
        acc[row.id] = row.views
        return acc
      }, {})
    },
    async fetchStarCounts() {
      const { data, error } = await supabase
        .from('documents_star_count')
        .select('item_id, star_count')

      if (error) {
        console.error('Error fetching star counts:', error)
        return
      }

      this.starCounts = data.reduce((acc, row) => {
        acc[row.item_id] = row.star_count
        return acc
      }, {})
    },
    filterBy({ categories, authors, dates }, currentSort) {
      this.filteredDocuments = this.documents.filter((doc) => {
        const meta = doc.metadata || {}

        const matchesCategory =
          !categories.length ||
          categories.includes('All') ||
          (Array.isArray(meta.categories) &&
            meta.categories.some((c) =>
              categories.map((cat) => cat.toLowerCase()).includes(c.toLowerCase()),
            ))

        const matchesAuthor =
          !authors.length ||
          (meta.author &&
            meta.author
              .split(',')
              .some((a) => authors.map((au) => au.toLowerCase()).includes(a.trim().toLowerCase())))

        const matchesDate =
          !dates.length || (meta.date && dates.some((d) => meta.date.startsWith(d)))

        return matchesCategory && matchesAuthor && matchesDate
      })

      if (currentSort) {
        this.sortDocuments(currentSort)
      }
    },
    sortSettings(sort) {
      switch (sort) {
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
          return { field: null, order: 'asc' }
      }
    },
    sortDocuments(sortOption) {
      const { field, order } = this.sortSettings(sortOption.label || sortOption)
      if (!field) return

      console.log('Sorting by:', field, order)

      this.filteredDocuments = [...this.filteredDocuments].sort((a, b) => {
        let valA, valB

        if (field === 'title') {
          valA = (a.metadata?.title || '').trim().toLowerCase()
          valB = (b.metadata?.title || '').trim().toLowerCase()
          return order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        }

        if (field === 'origin') {
          valA = new Date(a.metadata?.date || 0)
          valB = new Date(b.metadata?.date || 0)
          return order === 'asc' ? valA - valB : valB - valA
        }

        // Default for uploaded_at, updated_at
        valA = new Date(a[field] || 0)
        valB = new Date(b[field] || 0)
        return order === 'asc' ? valA - valB : valB - valA
      })
    },
    resetFilters() {
      this.filteredDocuments = this.documents
    },
    async getDocById(id) {
      try {
        // Get title from metadata if available
        const { data } = await supabase
          .from('documents_metadata')
          .select('metadata->>title')
          .eq('id', id)
          .single()

        if (data) {
          return data
        }
      } catch (error) {
        console.error('Error fetching artifact title:', error)
        return null
      }
    },
  },
})
