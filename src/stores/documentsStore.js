import { defineStore } from 'pinia'

export const useModelStore = defineStore('documentsStore', {
  state: () => ({
    documentsUrls: [],
  }),
  actions: {
    addDocuments(url) {
      this.documentsUrls.push(...url)
    },
  },
})
