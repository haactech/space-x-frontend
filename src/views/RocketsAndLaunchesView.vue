<template>
  <div class="rockets-launches-container">
    <LoaderComponent v-if="isLoading" />
    <div class="launch-filters">
      <h3 class="filters-title">
        <i class="icon-filter"></i>
        Filtros de Launches
      </h3>

      <div class="filters-grid">
        <!-- Checkboxes Section -->
        <div class="checkbox-group">
          <label class="checkbox-label">
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                v-model="onlyUpcoming"
                class="checkbox-input"
              />
              <div class="checkbox-custom"></div>
            </div>
            <span>only Upcoming</span>
          </label>

          <label class="checkbox-label">
            <div class="checkbox-wrapper">
              <input
                type="checkbox"
                v-model="onlySuccess"
                class="checkbox-input"
              />
              <div class="checkbox-custom"></div>
            </div>
            <span>Only Successful</span>
          </label>
        </div>

        <div class="select-group">
          <div class="filter-control">
            <label class="filter-label">
              <i class="icon-sort"></i>
              Order by
            </label>
            <select v-model="sortField" class="filter-select">
              <option value="date_utc">Date</option>
              <option value="flight_number">Flight Number</option>
            </select>
          </div>

          <div class="filter-control">
            <label class="filter-label">
              <i class="icon-sort"></i>
              Order
            </label>
            <select v-model="sortOrder" class="filter-select">
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>

        <div class="pagination-group">
          <div class="filter-control">
            <label class="filter-label">
              <i class="icon-list"></i>
              Page
            </label>
            <input
              type="number"
              v-model.number="currentPage"
              min="1"
              class="filter-input"
            />
          </div>

          <div class="filter-control">
            <label class="filter-label">
              <i class="icon-hash"></i>
              Items by page
            </label>
            <input
              type="number"
              v-model.number="pageLimit"
              min="1"
              max="100"
              class="filter-input"
            />
          </div>
        </div>
      </div>

      <!-- Apply Button -->
      <div class="button-container">
        <button @click="applyLaunchFilters" class="filter-button">
          Apply filters
          <i class="icon-chevron-right"></i>
        </button>
      </div>
    </div>

    <div class="charts-grid" v-if="rocketsData && launchesData">
      <div class="chart-box">
        <h2>Rocket Specifications</h2>
        <div ref="rocketSpecsChart" class="chart-container"></div>
      </div>

      <div class="chart-box">
        <h2>Launches Timeline</h2>
        <div ref="launchesTimelineChart" class="chart-container"></div>
      </div>
    </div>

    <div v-if="rocketsData">
      <h2>All Rockets</h2>
      <table class="rockets-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Height (m)</th>
            <th>Mass (kg)</th>
            <th>Cost Per Launch</th>
            <th>Success Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="rocket in rocketsData" :key="rocket.id">
            <td>{{ rocket.name }}</td>
            <td>{{ rocket.height.meters }}</td>
            <td>{{ rocket.mass.kg }}</td>
            <td>{{ rocket.cost_per_launch.toLocaleString() }}</td>
            <td>{{ rocket.success_rate_pct }}%</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="launchesData">
      <h2>All Launches</h2>
      <table class="launches-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Rocket ID</th>
            <th>Date (UTC)</th>
            <th>Success?</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="launch in launchesData.docs" :key="launch.id">
            <td>{{ launch.name }}</td>
            <td>{{ launch.rocket }}</td>
            <td>{{ launch.date_utc }}</td>
            <td>{{ launch.success !== null ? launch.success : 'Unknown' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div ref="tooltip" class="tooltip"></div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import * as d3 from 'd3'
  import LoaderComponent from '../components/LoaderComponent.vue'
  import { useLoading } from '@/composables/useLoading'

  const { isLoading, withLoading } = useLoading()
  const rocketsData = ref(null)
  const launchesData = ref(null)

  // filters and pagination
  const onlyUpcoming = ref(false)
  const onlySuccess = ref(false)
  const sortField = ref('date_utc')
  const sortOrder = ref('asc')
  const currentPage = ref(1)
  const pageLimit = ref(20)

  //charts references
  const rocketSpecsChart = ref(null)
  const launchesTimelineChart = ref(null)
  const tooltip = ref(null)

  async function fetchRockets() {
    try {
      const res = await fetch('http://localhost:8000/api/v1/rockets')
      if (!res.ok) throw new Error('Error al obtener Rockets')
      const data = await res.json()
      rocketsData.value = data
    } catch (error) {
      console.error(error)
    }
  }

  async function fetchLaunches() {
    try {
      const queryParams = new URLSearchParams({
        page: currentPage.value,
        limit: pageLimit.value,
        sort: sortField.value,
        order: sortOrder.value
      })

      if (onlyUpcoming.value) {
        queryParams.set('upcoming', true)
      }

      if (onlySuccess.value) {
        queryParams.set('success', true)
      }

      const url = `http://localhost:8000/api/v1/launches/?${queryParams.toString()}`

      const res = await fetch(url)
      if (!res.ok) throw new Error('Error al obtener Launches')
      const data = await res.json()
      launchesData.value = data
    } catch (error) {
      console.error(error)
    }
  }

  function applyLaunchFilters() {
    withLoading(fetchLaunches)
  }

  function drawRocketSpecsChart() {
    d3.select(rocketSpecsChart.value).selectAll('*').remove()
    if (!rocketsData.value || !rocketSpecsChart.value) return

    const rockets = rocketsData.value

    const containerWidth = rocketSpecsChart.value.clientWidth || 800
    const containerHeight = rocketSpecsChart.value.clientHeight || 400
    const margin = { top: 30, right: 30, bottom: 50, left: 70 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    const svg = d3
      .select(rocketSpecsChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3
      .scaleBand()
      .domain(rockets.map(r => r.name))
      .range([0, width])
      .padding(0.2)

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(rockets, r => r.mass.kg)])
      .nice()
      .range([height, 0])

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))

    g.append('g').call(d3.axisLeft(y).tickFormat(d3.format('~s')))

    g.selectAll('.rocket-bar')
      .data(rockets)
      .enter()
      .append('rect')
      .attr('class', 'rocket-bar')
      .attr('x', d => x(d.name))
      .attr('y', height)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', '#4caf50')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill', '#2e7d32')
        d3
          .select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
          .style('opacity', 0.9).html(`
            <strong>${d.name}</strong><br/>
            Mass: ${d.mass.kg.toLocaleString()} kg<br/>
            Cost/Launch: $${d.cost_per_launch.toLocaleString()}
          `)
      })
      .on('mousemove', event => {
        d3.select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#4caf50')
        d3.select(tooltip.value).style('opacity', 0)
      })
      .transition()
      .duration(800)
      .attr('y', d => y(d.mass.kg))
      .attr('height', d => height - y(d.mass.kg))
  }

  function drawLaunchesTimelineChart() {
    d3.select(launchesTimelineChart.value).selectAll('*').remove()
    if (!launchesData.value || !launchesTimelineChart.value) return

    const docs = launchesData.value.docs || []
    if (!docs.length) return

    const parseDate = d3.timeParse('%Y-%m-%dT%H:%M:%S.%LZ')
    docs.forEach(launch => {
      launch.dateParsed = parseDate(launch.date_utc)
    })

    const validLaunches = docs.filter(l => l.dateParsed)

    validLaunches.sort((a, b) => a.dateParsed - b.dateParsed)

    const containerWidth = launchesTimelineChart.value.clientWidth || 800
    const containerHeight = launchesTimelineChart.value.clientHeight || 400
    const margin = { top: 30, right: 30, bottom: 50, left: 50 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    const svg = d3
      .select(launchesTimelineChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)

    const x = d3
      .scaleTime()
      .domain(d3.extent(validLaunches, d => d.dateParsed))
      .range([0, width])

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(validLaunches, d => d.flight_number)])
      .nice()
      .range([height, 0])

    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5))

    g.append('g').call(d3.axisLeft(y))

    g.selectAll('.launch-dot')
      .data(validLaunches)
      .enter()
      .append('circle')
      .attr('class', 'launch-dot')
      .attr('cx', d => x(d.dateParsed))
      .attr('cy', d => y(d.flight_number))
      .attr('r', 4)
      .attr('fill', '#2196f3')
      .on('mouseover', function (event, d) {
        d3.select(this).attr('fill', '#1769aa')
        d3
          .select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
          .style('opacity', 0.9).html(`
            <strong>${d.name}</strong><br/>
            Flight #: ${d.flight_number}<br/>
            Date: ${d.date_utc}
          `)
      })
      .on('mousemove', event => {
        d3.select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#2196f3')
        d3.select(tooltip.value).style('opacity', 0)
      })
  }

  function drawAllCharts() {
    drawRocketSpecsChart()
    drawLaunchesTimelineChart()
  }

  onMounted(async () => {
    await withLoading(fetchRockets)
    await withLoading(fetchLaunches)
    drawAllCharts()

    window.addEventListener('resize', drawAllCharts)
  })

  watch([rocketsData, launchesData], () => {
    drawAllCharts()
  })
</script>

<style scoped>
  .rockets-launches-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    padding: 1rem;
    background-color: #121212;
    min-height: 100vh;
  }

  .filter-section {
    margin-bottom: 1rem;
  }

  .charts-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
    min-height: 400px;
  }

  .chart-box {
    background-color: #1e1e1e;
    border-radius: 6px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.5);
    position: relative;
    overflow: hidden;
    padding: 1rem;
    min-height: 450px;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
  }

  .chart-container {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .rockets-table,
  .launches-table {
    width: 100%;
    border-collapse: collapse;
  }

  .rockets-table th,
  .rockets-table td,
  .launches-table th,
  .launches-table td {
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

  .launch-filters {
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

  .checkbox-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    color: #a0aec0;
    cursor: pointer;
    transition: color 0.2s ease;
  }

  .checkbox-label:hover {
    color: #e2e8f0;
  }

  .checkbox-wrapper {
    position: relative;
    width: 1.25rem;
    height: 1.25rem;
  }

  .checkbox-input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .checkbox-custom {
    position: absolute;
    top: 0;
    left: 0;
    width: 1.25rem;
    height: 1.25rem;
    background-color: #121212;
    border: 2px solid #4a5568;
    border-radius: 0.25rem;
    transition: all 0.2s ease;
  }

  .checkbox-input:checked + .checkbox-custom {
    background-color: #2563eb;
    border-color: #2563eb;
  }

  .checkbox-input:checked + .checkbox-custom::after {
    content: '';
    position: absolute;
    left: 6px;
    top: 2px;
    width: 5px;
    height: 10px;
    border: solid white;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .filter-control {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .filter-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #a0aec0;
    font-size: 0.875rem;
    font-weight: 500;
  }

  .filter-select,
  .filter-input {
    width: 100%;
    background-color: #121212;
    border: 1px solid #2d2d2d;
    border-radius: 0.375rem;
    padding: 0.5rem 1rem;
    color: #eee;
    transition: all 0.2s ease;
  }

  .filter-select:focus,
  .filter-input:focus {
    outline: none;
    border-color: #3182ce;
    box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.2);
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
