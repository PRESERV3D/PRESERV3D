import { defineStore } from 'pinia'

export const useModelStore = defineStore('modelStore', {
  state: () => ({
    models: [],
  }),
  actions: {
    setModels(mods) {
      this.models = mods
    },
    addModel(model) {
      this.models.push(model)
    },
  },
})
