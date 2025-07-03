import { defineStore } from 'pinia'

export const useDocumentsStore = defineStore('documentsStore', {
  state: () => ({
    documents: [],
    filteredDocuments: [],
  }),
  actions: {
    setDocuments(docs) {
      this.documents = docs
      this.filteredDocuments = docs
    },
    addDocument(doc) {
      this.documents.push(doc)
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
  },
})
