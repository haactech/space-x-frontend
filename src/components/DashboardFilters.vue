<template>
    <div class="filters-container">
      <div class="filter-group">
        <h3>Date Range</h3>
        <div class="date-inputs">
          <div class="input-group">
            <label>From:</label>
            <input 
              type="date" 
              v-model="filters.dateRange.start"
              @change="handleFilterChange"
            >
          </div>
          <div class="input-group">
            <label>To:</label>
            <input 
              type="date" 
              v-model="filters.dateRange.end"
              @change="handleFilterChange"
            >
          </div>
        </div>
      </div>
  
      <div class="filter-group">
        <h3>Rockets</h3>
        <div class="checkbox-group">
          <label v-for="rocket in rocketOptions" :key="rocket.id">
            <input 
              type="checkbox" 
              :value="rocket.id"
              v-model="filters.selectedRockets"
              @change="handleFilterChange"
            >
            {{ rocket.name }}
          </label>
        </div>
      </div>
  
      <div class="filter-group">
        <h3>Mission Status</h3>
        <select 
          v-model="filters.missionSuccess"
          @change="handleFilterChange"
        >
          <option value="all">All Missions</option>
          <option value="success">Successful Only</option>
          <option value="failed">Failed Only</option>
        </select>
      </div>
  
      <div class="filter-group">
        <h3>Starlink Version</h3>
        <select 
          v-model="filters.starlinkVersion"
          @change="handleFilterChange"
        >
          <option value="all">All Versions</option>
          <option value="v0.9">Version 0.9</option>
          <option value="v1.0">Version 1.0</option>
          <option value="v1.5">Version 1.5</option>
        </select>
      </div>
  
      <button 
        class="reset-button"
        @click="resetFilters"
      >
        Reset Filters
      </button>
    </div>
  </template>
  
  <script setup>
  import { ref, watch } from 'vue'
  
  const emit = defineEmits(['filter-change'])
  
  const rocketOptions = [
    { id: 'falcon1', name: 'Falcon 1' },
    { id: 'falcon9', name: 'Falcon 9' },
    { id: 'falconheavy', name: 'Falcon Heavy' },
    { id: 'starship', name: 'Starship' }
  ]
  
  const filters = ref({
    dateRange: {
      start: '',
      end: ''
    },
    selectedRockets: [],
    missionSuccess: 'all',
    starlinkVersion: 'all'
  })
  
  const handleFilterChange = () => {
    emit('filter-change', filters.value)
  }
  
  const resetFilters = () => {
    filters.value = {
      dateRange: {
        start: '',
        end: ''
      },
      selectedRockets: [],
      missionSuccess: 'all',
      starlinkVersion: 'all'
    }
    handleFilterChange()
  }
  
  </script>
  
  <style scoped>
  .filters-container {
    background-color: #1e1e1e;
    padding: 1.5rem;
    border-radius: 6px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
    margin-bottom: 2rem;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.5rem;
    color: #eee;
  }
  
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .filter-group h3 {
    font-size: 1rem;
    margin-bottom: 0.5rem;
    color: #fff;
  }
  
  .date-inputs {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .input-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  input[type="date"],
  select {
    background-color: #2c2c2c;
    border: 1px solid #444;
    color: #fff;
    padding: 0.5rem;
    border-radius: 4px;
    width: 100%;
  }
  
  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .reset-button {
    background-color: #2196f3;
    color: white;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .reset-button:hover {
    background-color: #1976d2;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .filters-container {
      grid-template-columns: 1fr;
    }
  }
  </style>