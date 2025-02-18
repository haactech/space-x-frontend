<template>
    <div class="starlink-container">
      <h1>Starlink Dashboard</h1>
  
      <!-- Grilla de dos columnas, por ejemplo: Graf. de Versiones / Mapa (o scatter) -->
      <div class="charts-grid" v-if="starlinkData">
        <div class="chart-box">
          <h2>Starlink Versions Overview</h2>
          <div ref="versionChart" class="chart-container"></div>
        </div>
  
        <div class="chart-box">
          <h2>Satellite Positions</h2>
          <div ref="positionsChart" class="chart-container"></div>
        </div>
      </div>
  
      <!-- Tabla opcional de satélites (versión, altura, etc.) -->
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
  import * as d3 from 'd3'
  
  const starlinkData = ref(null)
  
  // Refs a contenedores de gráficas
  const versionChart = ref(null)
  const positionsChart = ref(null)
  const tooltip = ref(null)
  
  // Fetch a tu endpoint principal que provee `starlink_data`
  async function fetchStarlinkDashboardData() {
    try {
      const res = await fetch('http://localhost:8000/api/v1/dashboard') // O la ruta real
      if (!res.ok) throw new Error('Error al obtener datos de Starlink')
      const data = await res.json()
      // Guardar la parte de starlink
      starlinkData.value = data.starlink_data
    } catch (error) {
      console.error(error)
    }
  }
  
  /* ------------------ Ejemplo: Chart 1 - Versions (Bar Chart) ------------------ */
  function drawVersionChart() {
    if (!versionChart.value || !starlinkData.value) return
    
    d3.select(versionChart.value).selectAll('*').remove()
    
    const orbits = starlinkData.value.orbital_parameters || []
    if (!orbits.length) return
  
    // Add fallback dimensions
    const containerWidth = versionChart.value?.clientWidth || 600
    const containerHeight = versionChart.value?.clientHeight || 400
    const margin = { top: 30, right: 30, bottom: 50, left: 60 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom
  
    // SVG
    const svg = d3.select(versionChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
  
    // Escala X: version
    const x = d3.scaleBand()
      .domain(orbits.map(d => d.version))
      .range([0, width])
      .padding(0.2)
  
    // Escala Y: count
    const y = d3.scaleLinear()
      .domain([0, d3.max(orbits, d => d.count)])
      .nice()
      .range([height, 0])
  
    // Ejes
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
  
    g.append('g')
      .call(d3.axisLeft(y))
  
    // Barras
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
        d3.select(tooltip.value)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
          .style('opacity', 0.9)
          .html(`
            <strong>Version: ${d.version}</strong><br/>
            Count: ${d.count}<br/>
            Avg Height: ${d.average_height_km.toFixed(2)} km<br/>
            Avg Velocity: ${d.average_velocity_kms.toFixed(2)} km/s
          `)
      })
      .on('mousemove', function (event) {
        d3.select(tooltip.value)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
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
  
  /* ------------------ Ejemplo: Chart 2 - Satellite Positions (Scatter, simplificado) ------------------ */
  function drawPositionsChart() {
    if (!positionsChart.value || !starlinkData.value) return
  
    d3.select(positionsChart.value).selectAll('*').remove()
    
    const sats = starlinkData.value.satellite_positions || []
    if (!sats.length) return
  
    // Add fallback dimensions
    const containerWidth = positionsChart.value?.clientWidth || 600
    const containerHeight = positionsChart.value?.clientHeight || 400
    const margin = { top: 30, right: 30, bottom: 50, left: 60 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom
  
    const svg = d3.select(positionsChart.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
  
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
  
    // Escala X: longitud -180 a 180
    const x = d3.scaleLinear()
      .domain([-180, 180])
      .range([0, width])
  
    // Escala Y: latitud -90 a 90
    const y = d3.scaleLinear()
      .domain([-90, 90])
      .range([height, 0])
  
    // Ejes
    g.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x))
  
    g.append('g')
      .call(d3.axisLeft(y))
  
    // Dibujamos círculos
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
        d3.select(tooltip.value)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
          .style('opacity', 0.9)
          .html(`
            <strong>${d.id}</strong><br/>
            Lat: ${d.latitude.toFixed(2)}<br/>
            Lon: ${d.longitude.toFixed(2)}<br/>
            Height: ${d.height_km.toFixed(2)} km
          `)
      })
      .on('mousemove', function (event) {
        d3.select(tooltip.value)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY + 10) + 'px')
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
    await fetchStarlinkDashboardData()
    
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
  
  // Update watch handler
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
    background-color: #121212; /* oscuro */
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
    min-height: 400px; /* Explicit minimum height */
  }
  
  .starlink-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
  }
  
  .starlink-table th, .starlink-table td {
    padding: 0.75rem;
    border-bottom: 1px solid #333;
  }
  
  /* Tooltip global */
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
  