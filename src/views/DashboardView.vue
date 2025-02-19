<template>
  <div class="dashboard-container">
    <LoaderComponent v-if="isLoading" />
    <div class="metrics-grid" v-if="dashboardData">
      <div class="metric-card">
        <h3>Total Launches</h3>
        <p>{{ dashboardData.summary_metrics.total_launches }}</p>
      </div>
      <div class="metric-card">
        <h3>Success Rate</h3>
        <p>{{ dashboardData.summary_metrics.success_rate.toFixed(2) }}%</p>
      </div>
      <div class="metric-card">
        <h3>Active Rockets</h3>
        <p>{{ dashboardData.summary_metrics.active_rockets }}</p>
      </div>
      <div class="metric-card">
        <h3>Starlink Satellites</h3>
        <p>{{ dashboardData.summary_metrics.total_starlink_satellites }}</p>
      </div>
    </div>

    <div class="charts-grid" v-if="dashboardData">
      <div class="chart-box">
        <h2>Launch Frequency Over Time</h2>
        <div ref="lineChart" class="chart-container"></div>
      </div>
      <div class="chart-box">
        <h2>Rocket Cost Comparison</h2>
        <div ref="barChart" class="chart-container"></div>
      </div>
    </div>

    <div class="charts-grid-lower" v-if="dashboardData">
      <div class="chart-box">
        <h2>Global Success Rate</h2>
        <div ref="donutChart" class="chart-container"></div>
      </div>
      <div class="chart-box">
        <h2>Starlink Versions Overview</h2>
        <div ref="starlinkChart" class="chart-container"></div>
      </div>
    </div>

    <div ref="tooltip" class="tooltip"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as d3 from 'd3'
import LoaderComponent from '../components/LoaderComponent.vue'
import { useLoading } from '../composables/useLoading'

const dashboardData = ref(null)
const { isLoading, withLoading } = useLoading()

const lineChart = ref(null)
const barChart = ref(null)
const donutChart = ref(null)
const starlinkChart = ref(null)
const tooltip = ref(null)

const fetchDashboardData = async () => {
  try {
    const response = await fetch('http://localhost:8000/api/v1/dashboard')
    if (!response.ok) {
      throw new Error('Error al obtener datos del Dashboard')
    }
    const data = await response.json()
    dashboardData.value = data
  } catch (error) {
    console.error('Fetch error:', error)
  }
}

/**
 * Helpers para obtener ancho y alto del contenedor
 * Esto hace posible que el gráfico sea tan grande
 * como su contenedor en la interfaz.
 */
function getContainerSize(refEl) {
  if (!refEl) return { width: 400, height: 300 }
  const width = refEl.clientWidth
  const height = refEl.clientHeight
  return { width, height }
}

/* ----------------------------------------------------
 * 1) Gráfico de Líneas: Frecuencia de Lanzamientos
 * -------------------------------------------------- */
const drawLineChart = () => {
  d3.select(lineChart.value).selectAll('*').remove()
  if (!dashboardData.value) return

  // Sacamos datos de frequency_data
  const freqData = dashboardData.value.launch_metrics?.frequency_data || []
  if (!freqData.length) return

  // Parsear fecha "YYYY-MM"
  const parseDate = d3.timeParse('%Y-%m')
  freqData.forEach(d => {
    d.parsedDate = parseDate(d.date)
  })

  // Tamaño dinámico segun el contenedor
  const { width: containerWidth, height: containerHeight } = getContainerSize(lineChart.value)
  // Márgenes
  const margin = { top: 30, right: 30, bottom: 50, left: 60 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  // Crear SVG
  const svg = d3.select(lineChart.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Escalas
  const x = d3.scaleTime()
    .domain(d3.extent(freqData, d => d.parsedDate))
    .range([0, width])

  const y = d3.scaleLinear()
    .domain([0, d3.max(freqData, d => d.launches)])
    .nice()
    .range([height, 0])

  // Ejes
  g.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.timeFormat('%Y-%m')))

  g.append('g')
    .call(d3.axisLeft(y))

  // Generador de línea
  const line = d3.line()
    .x(d => x(d.parsedDate))
    .y(d => y(d.launches))
    .curve(d3.curveMonotoneX)

  // Dibujar la línea
  g.append('path')
    .datum(freqData)
    .attr('fill', 'none')
    .attr('stroke', '#2196f3')
    .attr('stroke-width', 2)
    .attr('d', line)

  // Puntos
  g.selectAll('.dot')
    .data(freqData)
    .enter()
    .append('circle')
    .attr('class', 'dot')
    .attr('cx', d => x(d.parsedDate))
    .attr('cy', d => y(d.launches))
    .attr('r', 4)
    .attr('fill', '#2196f3')
    .on('mouseover', function (event, d) {
      d3.select(this).attr('fill', '#1769aa')
      d3.select(tooltip.value)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .style('opacity', 0.9)
        .html(`
          <strong>${d.date}</strong><br/>
          Launches: ${d.launches}
        `)
    })
    .on('mousemove', function (event) {
      d3.select(tooltip.value)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
    })
    .on('mouseout', function () {
      d3.select(this).attr('fill', '#2196f3')
      d3.select(tooltip.value).style('opacity', 0)
    })
}

/* ----------------------------------------------------
 * 2) Gráfico de Barras: Rocket Cost Comparison
 * -------------------------------------------------- */
const drawBarChart = () => {
  d3.select(barChart.value).selectAll('*').remove()
  if (!dashboardData.value) return

  const rockets = dashboardData.value.rocket_comparison?.specifications || []
  if (!rockets.length) return

  // Tamaño dinámico
  const { width: containerWidth, height: containerHeight } = getContainerSize(barChart.value)
  const margin = { top: 30, right: 30, bottom: 50, left: 70 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  // Crear SVG
  const svg = d3.select(barChart.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Escalas
  const x = d3.scaleBand()
    .domain(rockets.map(d => d.name))
    .range([0, width])
    .padding(0.2)

  const y = d3.scaleLinear()
    .domain([0, d3.max(rockets, d => d.cost_per_launch)])
    .nice()
    .range([height, 0])

  // Ejes
  g.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))

  g.append('g')
    .call(d3.axisLeft(y).tickFormat(d => `$${d3.format('.2s')(d)}`))

  // Barras
  g.selectAll('.bar')
    .data(rockets)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.name))
    .attr('y', height)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', '#4caf50')
    .on('mouseover', function (event, d) {
      d3.select(this).attr('fill', '#2e7d32')
      d3.select(tooltip.value)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .style('opacity', 0.9)
        .html(`
          <strong>${d.name}</strong><br/>
          Cost: $${d.cost_per_launch.toLocaleString()}<br/>
          Success Rate: ${d.success_rate}%
        `)
    })
    .on('mousemove', function (event) {
      d3.select(tooltip.value)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
    })
    .on('mouseout', function () {
      d3.select(this).attr('fill', '#4caf50')
      d3.select(tooltip.value).style('opacity', 0)
    })
    // Animación de las barras
    .transition()
    .duration(800)
    .attr('y', d => y(d.cost_per_launch))
    .attr('height', d => height - y(d.cost_per_launch))
}

/* ----------------------------------------------------
 * 3) Donut Chart: Global Success Rate
 * -------------------------------------------------- */
const drawDonutChart = () => {
  d3.select(donutChart.value).selectAll('*').remove()
  if (!dashboardData.value) return

  const successRate = dashboardData.value.summary_metrics.success_rate || 0

  // Tamaño dinámico
  const { width: containerWidth, height: containerHeight } = getContainerSize(donutChart.value)
  // Para un donut, usaremos el mínimo
  const size = Math.min(containerWidth, containerHeight)
  const margin = 10
  const radius = size / 2 - margin

  const svg = d3.select(donutChart.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg
    .append('g')
    .attr('transform', `translate(${containerWidth / 2}, ${containerHeight / 2})`)

  const data = {
    success: successRate,
    fail: 100 - successRate
  }

  const color = d3.scaleOrdinal()
    .domain(['success', 'fail'])
    .range(['#2196f3', '#dadada'])

  const pie = d3.pie()
    .value(d => d[1])
    .sort(null)

  const data_ready = pie(Object.entries(data))

  const arcGenerator = d3.arc()
    .innerRadius(radius * 0.6)
    .outerRadius(radius)

  // Dibujar arcos
  g.selectAll('path')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('fill', d => color(d.data[0]))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .transition()
    .duration(700)
    .attrTween('d', function (d) {
      const i = d3.interpolate(d.startAngle + 0.1, d.endAngle)
      return t => {
        d.endAngle = i(t)
        return arcGenerator(d)
      }
    })

  // Interacciones con tooltip
  g.selectAll('path')
    .data(data_ready)
    .on('mouseover', function (event, d) {
      d3.select(this).transition().duration(200).attr('fill', '#1769aa')
      d3.select(tooltip.value)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .style('opacity', 0.9)
        .html(`
          <strong>${d.data[0] === 'success' ? 'Success' : 'Fail'} Rate:</strong> 
          ${d.data[1].toFixed(2)}%
        `)
    })
    .on('mousemove', function (event) {
      d3.select(tooltip.value)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
    })
    .on('mouseout', function (event, d) {
      d3.select(this).transition().duration(200)
        .attr('fill', color(d.data[0]))
      d3.select(tooltip.value).style('opacity', 0)
    })
}

/* ----------------------------------------------------
 * 4) Bar Chart: Starlink Versions Overview
 * -------------------------------------------------- */
const drawStarlinkChart = () => {
  d3.select(starlinkChart.value).selectAll('*').remove()
  if (!dashboardData.value) return

  const starParams = dashboardData.value.starlink_data?.orbital_parameters || []
  if (!starParams.length) return

  // Tamaño dinámico
  const { width: containerWidth, height: containerHeight } = getContainerSize(starlinkChart.value)
  const margin = { top: 30, right: 30, bottom: 50, left: 70 }
  const width = containerWidth - margin.left - margin.right
  const height = containerHeight - margin.top - margin.bottom

  const svg = d3.select(starlinkChart.value)
    .append('svg')
    .attr('width', containerWidth)
    .attr('height', containerHeight)

  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  // Escalas
  const x = d3.scaleBand()
    .domain(starParams.map(d => d.version))
    .range([0, width])
    .padding(0.2)

  const y = d3.scaleLinear()
    .domain([0, d3.max(starParams, d => d.count)])
    .nice()
    .range([height, 0])

  // Ejes
  g.append('g')
    .attr('transform', `translate(0, ${height})`)
    .call(d3.axisBottom(x))

  g.append('g')
    .call(d3.axisLeft(y))

  // Barras
  g.selectAll('.bar-starlink')
    .data(starParams)
    .enter()
    .append('rect')
    .attr('class', 'bar-starlink')
    .attr('x', d => x(d.version))
    .attr('y', height)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', '#ff9800')
    .on('mouseover', function (event, d) {
      d3.select(this).attr('fill', '#e65100')
      d3.select(tooltip.value)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
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
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
    })
    .on('mouseout', function () {
      d3.select(this).attr('fill', '#ff9800')
      d3.select(tooltip.value).style('opacity', 0)
    })
    // Animación de las barras
    .transition()
    .duration(800)
    .attr('y', d => y(d.count))
    .attr('height', d => height - y(d.count))
}

// Montar y ver datos
onMounted(async () => {
  await withLoading(fetchDashboardData)
  drawAllCharts()

  // (Opcional) Redibujar al cambiar el tamaño de la ventana
  window.addEventListener('resize', drawAllCharts)
})

// Cada vez que cambien los datos
watch(dashboardData, () => {
  drawAllCharts()
})

// Función para dibujar o redibujar todos los gráficos
function drawAllCharts() {
  drawLineChart()
  drawBarChart()
  drawDonutChart()
  drawStarlinkChart()
}
</script>

<style scoped>
/* Tema oscuro de fondo */
.dashboard-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
  background-color: #121212;  /* Fondo oscuro */
  color: #eee;               /* Texto claro */
  min-height: 100vh;
}

/* Título */
.dashboard-container h1 {
  margin: 0.5rem 0;
}

/* Fila con tarjetas de métricas */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric-card {
  background-color: #1e1e1e;
  padding: 1.5rem;
  text-align: center;
  border-radius: 6px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.5);
}

/* Filas de gráficas */
.charts-grid, 
.charts-grid-lower {
  display: grid;
  grid-template-columns: 1fr 1fr; /* dos columnas */
  gap: 2rem;
  min-height: 450px; /* Aumentamos la altura mínima para gráficas */
}

/* Caja de cada gráfica */
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
  align-items: center;
  justify-content: flex-start;
}

/* Título de cada chart */
.chart-box h2 {
  margin-bottom: 0.5rem;
}

/* Contenedor interno para el SVG */
.chart-container {
  width: 100%;
  height: 100%;
  position: relative;
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
