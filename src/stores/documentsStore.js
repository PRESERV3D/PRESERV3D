import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useDocumentsStore = defineStore('documentsStore', {
  state: () => ({
    documents: [],
    filteredDocuments: [],
    viewCounts: {}, // { [item_id]: view_count }
    starCounts: {}, // { [item_id]: star_count }
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
      console.log('Fetched view counts:', data)

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
      // ADDED: Fetch star counts
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
    sortBy(field, order) {
      this.filteredDocuments = [...this.documents]

      const getValue = (doc) => {
        if (field === 'title') {
          return (doc.metadata?.title || '').trim().toLowerCase()
        }
        if (field === 'uploaded_at') {
          return new Date(doc.uploaded_at || 0)
        }
        return doc[field]
      }

      this.filteredDocuments.sort((a, b) => {
        const valA = getValue(a)
        const valB = getValue(b)

        if (field === 'title') {
          return (
            valA.localeCompare(valB, undefined, { sensitivity: 'base' }) *
            (order === 'desc' ? 1 : -1)
          )
        } else if (field === 'uploaded_at') {
          return (valA - valB) * (order === 'asc' ? 1 : -1)
        }
      })
    },
    filterBy({ category, author, date }) {
      this.filteredDocuments = this.documents.filter((doc) => {
        const meta = doc.metadata || {}

        const matchesCategory =
          !category ||
          (Array.isArray(meta.categories) &&
            meta.categories.some((c) => c.toLowerCase() === category.toLowerCase()))

        const matchesAuthor =
          !author || (meta.author && meta.author.toLowerCase().includes(author.toLowerCase()))

        const matchesDate = !date || (meta.date && meta.date.startsWith(date)) // year-only match

        return matchesCategory && matchesAuthor && matchesDate
      })
    },
    resetFilters() {
      this.filteredDocuments = this.documents
    },
    async getDocById(id) {
      try {
        //get title from metadata if available
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
