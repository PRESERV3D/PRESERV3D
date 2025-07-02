import { defineStore } from 'pinia'

export const useDocumentsStore = defineStore('documentsStore', {
  state: () => ({
    documents: [], // will hold { url, metadata } objects
  }),
  actions: {
    setDocuments(docs) {
      this.documents = docs
    },
    addDocument(doc) {
      this.documents.push(doc)
    },
  },
})
