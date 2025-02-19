<template>
  <div class="starlink-container">
    <LoaderComponent v-if="isLoading" />

    <div class="starlink-filters">
      <h3 class="filters-title">
        <i class="icon-satellite"></i>
        Filtros de Starlink
      </h3>

      <div class="filters-grid">
        <div class="filter-control">
          <label class="filter-label">
            <i class="icon-list"></i>
            Página de Starlink
          </label>
          <input
            type="number"
            v-model.number="starlinkPage"
            min="1"
            class="filter-input"
          />
        </div>

        <div class="filter-control">
          <label class="filter-label">
            <i class="icon-hash"></i>
            Satélites por página
          </label>
          <input
            type="number"
            v-model.number="starlinkLimit"
            min="1"
            max="5000"
            class="filter-input"
          />
        </div>

        <div class="filter-control">
          <label class="filter-label">
            <i class="icon-tag"></i>
            Versión (opcional)
          </label>
          <input
            type="text"
            v-model="starlinkVersion"
            placeholder="Ej: v1.0"
            class="filter-input"
          />
        </div>
      </div>

      <!-- Apply Button -->
      <div class="button-container">
        <button @click="applyStarlinkFilters" class="filter-button">
          Aplicar Filtros
          <i class="icon-chevron-right"></i>
        </button>
      </div>
    </div>

    <div class="charts-grid" v-if="starlinkData">
      <div class="chart-box">
        <div ref="versionChart" class="chart-container"></div>
      </div>

      <div class="chart-box">
        <StarlinkMap :satelliteData="starlinkData.satellite_positions" />
      </div>
    </div>

    <div v-if="starlinkData">
      <h2>Satellite List</h2>
      <table class="starlink-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Latitude</th>
            <th>Longitude</th>
            <th>Height (km)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sat in starlinkData.satellite_positions" :key="sat.id">
            <td>{{ sat.id }}</td>
            <td>{{ sat.latitude.toFixed(2) }}</td>
            <td>{{ sat.longitude.toFixed(2) }}</td>
            <td>{{ sat.height_km.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Tooltip para D3 -->
    <div ref="tooltip" class="tooltip"></div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch, nextTick } from 'vue'
  import { useLoading } from '../composables/useLoading'
  import * as d3 from 'd3'
  import StarlinkMap from '../components/StarlinkMap.vue'
  import LoaderComponent from '../components/LoaderComponent.vue'

  const { isLoading, withLoading } = useLoading()
  const starlinkData = ref(null)

  const starlinkPage = ref(1)
  const starlinkLimit = ref(300)
  const starlinkVersion = ref('')

  const versionChart = ref(null)
  const positionsChart = ref(null)
  const tooltip = ref(null)

  async function fetchStarlinkDashboardData() {
    try {
      const queryParams = new URLSearchParams({
        starlink_page: starlinkPage.value,
        starlink_limit: starlinkLimit.value
      })

      if (starlinkVersion.value) {
        queryParams.set('starlink_version', starlinkVersion.value)
      }

      const url = `http://localhost:8000/api/v1/dashboard?${queryParams.toString()}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al obtener datos de Starlink')
      const data = await res.json()
      starlinkData.value = data.starlink_data
    } catch (error) {
      console.error(error)
    }
  }

  function applyStarlinkFilters() {
    withLoading(fetchStarlinkDashboardData)
  }

  /* ------------------ Ejemplo: Chart 1 - Versions (Bar Chart) ------------------ */
  function drawVersionChart() {
    if (!versionChart.value || !starlinkData.value) return

    d3.select(versionChart.value).selectAll('*').remove()

    const orbits = starlinkData.value.orbital_parameters || []
    if (!orbits.length) return

    const containerWidth = versionChart.value?.clientWidth || 600
    const containerHeight = versionChart.value?.clientHeight || 400
    const margin = { top: 30, right: 30, bottom: 50, left: 60 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    const svg = d3
      .select(versionChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3
      .scaleBand()
      .domain(orbits.map(d => d.version))
      .range([0, width])
      .padding(0.2)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(orbits, d => d.count)])
      .nice()
      .range([height, 0])

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))

    g.append('g').call(d3.axisLeft(y))

    g.selectAll('.bar')
      .data(orbits)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.version))
      .attr('y', height)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', '#ff9800')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill', '#e65100')
        d3
          .select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
          .style('opacity', 0.9).html(`
            <strong>Version: ${d.version}</strong><br/>
            Count: ${d.count}<br/>
            Avg Height: ${d.average_height_km.toFixed(2)} km<br/>
            Avg Velocity: ${d.average_velocity_kms.toFixed(2)} km/s
          `)
      })
      .on('mousemove', function (event) {
        d3.select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#ff9800')
        d3.select(tooltip.value).style('opacity', 0)
      })
      .transition()
      .duration(800)
      .attr('y', d => y(d.count))
      .attr('height', d => height - y(d.count))
  }

  function drawPositionsChart() {
    if (!positionsChart.value || !starlinkData.value) return

    d3.select(positionsChart.value).selectAll('*').remove()

    const sats = starlinkData.value.satellite_positions || []
    if (!sats.length) return

    const containerWidth = positionsChart.value?.clientWidth || 600
    const containerHeight = positionsChart.value?.clientHeight || 400
    const margin = { top: 30, right: 30, bottom: 50, left: 60 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    const svg = d3
      .select(positionsChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3.scaleLinear().domain([-180, 180]).range([0, width])

    const y = d3.scaleLinear().domain([-90, 90]).range([height, 0])

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))

    g.append('g').call(d3.axisLeft(y))

    g.selectAll('.sat-dot')
      .data(sats)
      .enter()
      .append('circle')
      .attr('class', 'sat-dot')
      .attr('cx', d => x(d.longitude))
      .attr('cy', d => y(d.latitude))
      .attr('r', 3)
      .attr('fill', '#2196f3')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill', '#1769aa')
        d3
          .select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
          .style('opacity', 0.9).html(`
            <strong>${d.id}</strong><br/>
            Lat: ${d.latitude.toFixed(2)}<br/>
            Lon: ${d.longitude.toFixed(2)}<br/>
            Height: ${d.height_km.toFixed(2)} km
          `)
      })
      .on('mousemove', function (event) {
        d3.select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#2196f3')
        d3.select(tooltip.value).style('opacity', 0)
      })
  }

  // Dibuja todo
  function drawAllCharts() {
    drawVersionChart()
    drawPositionsChart()
  }

  // Update mounting logic
  onMounted(async () => {
    await withLoading(fetchStarlinkDashboardData)

    // Wait for DOM update
    await nextTick()
    drawAllCharts()

    // Debounce resize handler
    let resizeTimeout
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        nextTick(() => drawAllCharts())
      }, 250)
    })
  })

  watch(starlinkData, async () => {
    await nextTick()
    drawAllCharts()
  })
</script>

<style scoped>
  .starlink-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
    background-color: #121212;
    color: #eee;
    min-height: 100vh;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .chart-box {
    background-color: #1e1e1e;
    padding: 1rem;
    min-height: 450px;
    border-radius: 6px;
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .chart-container {
    width: 100%;
    height: 100%;
    position: relative;
    min-height: 400px;
  }

  .starlink-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }

  .starlink-table th,
  .starlink-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #333;
  }

  .tooltip {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    padding: 0.5rem;
    border-radius: 4px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.2s ease;
    font-size: 0.85rem;
    z-index: 9999;
  }

  .starlink-filters {
    background-color: #1e1e1e;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
    margin-bottom: 2rem;
  }

  .filters-title {
    color: #e2e8f0;
    font-size: 1.125rem;
    font-weight: 500;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .filters-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }

  .filter-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .filter-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #a0aec0;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .filter-input {
    width: 100%;
    background-color: #121212;
    border: 1px solid #2d2d2d;
    border-radius: 0.375rem;
    padding: 0.5rem 1rem;
    color: #eee;
    transition: all 0.2s ease;
  }

  .filter-input:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2);
  }

  .filter-input::placeholder {
    color: #4a5568;
  }

  .button-container {
    margin-top: 1.5rem;
    display: flex;
    justify-content: flex-start;
  }

  .filter-button {
    background-color: #2563eb;
    color: white;
    font-weight: 500;
    padding: 0.5rem 1.5rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: background-color 0.2s ease;
    border: none;
  }

  .filter-button:hover {
    background-color: #1d4ed8;
  }

  @media (max-width: 768px) {
    .filters-grid {
      grid-template-columns: 1fr;
    }

    .button-container {
      justify-content: stretch;
    }

    .filter-button {
      width: 100%;
      justify-content: center;
    }
  }
</style>
