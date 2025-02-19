import { defineStore } from 'pinia'

interface FiltersState {
  rocketId: string
  startYear: number | null
  endYear: number | null
  limit: number
  page: number
}

export const useFilterStore = defineStore('filterStore', {
  state: (): FiltersState => ({
    rocketId: '',
    startYear: null,
    endYear: null,
    limit: 100,
    page: 1
  }),
  
  actions: {
    setFilters(partialFilters: Partial<FiltersState>) {
      Object.assign(this, partialFilters)
    }
  }
})
