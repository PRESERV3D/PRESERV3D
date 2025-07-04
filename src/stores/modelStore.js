import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useModelStore = defineStore('modelStore', {
  state: () => ({
    models: [],
    filteredModels: [],
  }),
  actions: {
    setModels(mods) {
      this.models = mods
      this.filteredModels = mods
    },
    addModel(model) {
      this.models.push(model)
    },
    sortBy(field, order = 'asc') {
      const getValue = (mod) => {
        if (field === 'title') return mod.metadata.title.toLowerCase() || ''
        if (field === 'uploaded_at') return new Date(mod.uploaded_at)
        return mod[field]
      }

      this.filteredModels = [...this.filteredModels].sort((a, b) => {
        const valA = getValue(a)
        const valB = getValue(b)

        if (valA < valB) return order === 'asc' ? -1 : 1
        if (valA > valB) return order === 'asc' ? 1 : -1
        return 0
      })
    },
    filterBy({ category, author, date }) {
      this.filteredModels = this.models.filter((mod) => {
        const meta = mod.metadata || {}

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
      this.filteredModels = this.models
    },
    async getModelById(id) {
      try {
        //get title from metadata if available
        const { data } = await supabase
          .from('artifacts_metadata')
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
