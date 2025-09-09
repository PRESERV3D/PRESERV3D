import { defineStore } from 'pinia'
import { supabase } from 'boot/supabase'

export const useModelStore = defineStore('modelStore', {
  state: () => ({
    models: [],
    filteredModels: [],
    viewCounts: {}, // { [item_id]: views }
    starCounts: {}, // { [item_id]: star_count }
  }),
  actions: {
    setModels(mods) {
      this.models = mods
      this.filteredModels = mods
    },
    addModel(model) {
      this.models.push(model)
    },
    updateStarCount(itemId, newCount) {
      this.starCounts[itemId] = newCount
    },
    async fetchViewCounts() {
      const { data, error } = await supabase.from('artifacts_view').select('item_id, views')

      if (error) {
        console.error('Error fetching view counts:', error)
        return
      }

      // Build a lookup map: { id: count }
      this.viewCounts = data.reduce((acc, row) => {
        acc[row.item_id] = row.views
        return acc
      }, {})
    },
    async fetchStarCounts() {
      // ADDED: Fetch star counts
      const { data, error } = await supabase
        .from('artifacts_star_count')
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
    // sortBy(field, order = 'asc') {
    //   const getValue = (mod) => {
    //     if (field === 'title') return mod.metadata.title.toLowerCase() || ''
    //     if (field === 'uploaded_at') return new Date(mod.uploaded_at)
    //     return mod[field]
    //   }

    //   this.filteredModels = [...this.filteredModels].sort((a, b) => {
    //     const valA = getValue(a)
    //     const valB = getValue(b)

    //     if (valA < valB) return order === 'asc' ? -1 : 1
    //     if (valA > valB) return order === 'asc' ? 1 : -1
    //     return 0
    //   })
    // },

    filterBy({ categories, authors, dates }, currentSort) {
      this.filteredModels = this.models.filter((mod) => {
        const meta = mod.metadata || {}

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
      console.log('Sorting artifacts by:', sort)
      const { field, order } = this.sortSettings(sort)
      if (!field) return

      this.sortBy(field, order)
    },
    sortBy(field, order) {
      const getValue = (mod) => {
        if (field === 'title') return (mod.metadata?.title || '').trim().toLowerCase()
        if (field === 'uploaded_at') return new Date(mod.uploaded_at || 0)
        return mod[field]
      }

      this.filteredModels.sort((a, b) => {
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
