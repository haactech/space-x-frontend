<template>
    <div class="rockets-launches-container">
        <LoaderComponent v-if = "isLoading"/>
      <!-- 1. Filtros o selecciones opcionales -->
      <div class="filter-section">
        <!-- Por si quieres un dropdown de rockets, rangos de fecha, etc. -->
        <!-- <select v-model="selectedRocket"> ... </select> -->
      </div>
  
      <!-- 2. Grilla para las gráficas principales -->
      <div class="charts-grid" v-if="rocketsData && launchesData">
        <!-- Ejemplo de un Bar Chart comparando Cost o Masa de cada rocket -->
        <div class="chart-box">
          <h2>Rocket Specifications</h2>
          <div ref="rocketSpecsChart" class="chart-container"></div>
        </div>
  
        <!-- Ejemplo: Launches por Mes o por Año (se puede extraer de 'launchesData') -->
        <div class="chart-box">
          <h2>Launches Timeline</h2>
          <div ref="launchesTimelineChart" class="chart-container"></div>
        </div>
      </div>
  
      <!-- 3. Tabla de detalles de rockets -->
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
  
      <!-- 4. Tabla o lista de Launches -->
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
              <!-- Podrías mapear rocket ID a rocket name si lo necesitas -->
              <td>{{ launch.rocket }}</td>
              <td>{{ launch.date_utc }}</td>
              <td>{{ launch.success !== null ? launch.success : 'Unknown' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Tooltip para D3 -->
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
      const res = await fetch('http://localhost:8000/api/v1/launches/')
      if (!res.ok) throw new Error('Error al obtener Launches')
      const data = await res.json()
      // data.docs = array de lanzamientos
      launchesData.value = data
    } catch (error) {
      console.error(error)
    }
  }
  
  function drawRocketSpecsChart() {
    d3.select(rocketSpecsChart.value).selectAll('*').remove()
    if (!rocketsData.value || !rocketSpecsChart.value) return
  

    const rockets = rocketsData.value // array de rockets
  
    const containerWidth = rocketSpecsChart.value.clientWidth || 800
    const containerHeight = rocketSpecsChart.value.clientHeight || 400
    const margin = { top: 30, right: 30, bottom: 50, left: 70 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom
  
    const svg = d3.select(rocketSpecsChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
  
    const x = d3.scaleBand()
      .domain(rockets.map(r => r.name))
      .range([0, width])
      .padding(0.2)
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(rockets, r => r.mass.kg)])
      .nice()
      .range([height, 0])
  
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
  
    g.append('g')
      .call(d3.axisLeft(y).tickFormat(d3.format('~s')))
  
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
        d3.select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
          .style('opacity', 0.9)
          .html(`
            <strong>${d.name}</strong><br/>
            Mass: ${d.mass.kg.toLocaleString()} kg<br/>
            Cost/Launch: $${d.cost_per_launch.toLocaleString()}
          `)
      })
      .on('mousemove', (event) => {
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
  
    const svg = d3.select(launchesTimelineChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
  
    const x = d3.scaleTime()
      .domain(d3.extent(validLaunches, d => d.dateParsed))
      .range([0, width])
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(validLaunches, d => d.flight_number)])
      .nice()
      .range([height, 0])
  
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).ticks(5))
  
    g.append('g')
      .call(d3.axisLeft(y))
  
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
        d3.select(tooltip.value)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY + 10 + 'px')
          .style('opacity', 0.9)
          .html(`
            <strong>${d.name}</strong><br/>
            Flight #: ${d.flight_number}<br/>
            Date: ${d.date_utc}
          `)
      })
      .on('mousemove', (event) => {
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
    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
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
  
  .rockets-table, .launches-table {
    width: 100%;
    border-collapse: collapse;
  }
  
  .rockets-table th, .rockets-table td,
  .launches-table th, .launches-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #333;
  }
  
  .tooltip {
    position: absolute;
    background-color: rgba(0,0,0,0.8);
    color: #fff;
    padding: 0.5rem;
    border-radius: 4px;
    pointer-events: none; 
    opacity: 0;
    transition: opacity 0.2s ease;
    font-size: 0.85rem;
    z-index: 9999;
  }
  </style>
  