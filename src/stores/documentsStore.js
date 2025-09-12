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
    // sortBy(field, order) {
    //   this.filteredDocuments = [...this.filteredDocuments]

    //   const getValue = (doc) => {
    //     if (field === 'title') {
    //       return (doc.metadata?.title || '').trim().toLowerCase()
    //     }
    //     if (field === 'uploaded_at') {
    //       return new Date(doc.uploaded_at || 0)
    //     }
    //     return doc[field]
    //   }

    //   this.filteredDocuments.sort((a, b) => {
    //     const valA = getValue(a)
    //     const valB = getValue(b)

    //     if (field === 'title') {
    //       return (
    //         valA.localeCompare(valB, undefined, { sensitivity: 'base' }) *
    //         (order === 'asc' ? 1 : -1)
    //       )
    //     } else if (field === 'uploaded_at') {
    //       return (valA - valB) * (order === 'desc' ? 1 : -1)
    //     }
    //   })
    // },
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
        this.sortByField(currentSort)
      }
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
    sortByField(sort) {
      console.log('Sorting documents by:', sort)
      const { field, order } = this.sortSettings(sort)
      if (!field) return

      this.sortBy(field, order)
    },
    sortBy(field, order) {
      const getValue = (doc) => {
        if (field === 'title') return (doc.metadata?.title || '').trim().toLowerCase()
        if (field === 'uploaded_at') return new Date(doc.uploaded_at || 0)
        return doc[field]
      }

      this.filteredDocuments.sort((a, b) => {
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
