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
    sortBy(field, order = 'asc') {
      const getValue = (doc) => {
        if (field === 'title') return doc.metadata.title.toLowerCase() || ''
        if (field === 'uploaded_at') return new Date(doc.uploaded_at)
        return doc[field]
      }

      this.filteredDocuments = [...this.filteredDocuments].sort((a, b) => {
        const valA = getValue(a)
        const valB = getValue(b)

        if (valA < valB) return order === 'asc' ? -1 : 1
        if (valA > valB) return order === 'desc' ? 1 : -1
        return 0
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
