<template>
  <div class="starlink-map-container">
    <div ref="mapContainer" class="map-container"></div>
    <!-- Tooltip con position:fixed para garantizar que no se recorte -->
    <div ref="tooltip" class="tooltip"></div>
  </div>
</template>

<script setup>
  import { ref, onMounted, watch } from 'vue'
  import * as d3 from 'd3'

  const props = defineProps({
    satelliteData: {
      type: Array,
      default: () => []
    }
  })

  const mapContainer = ref(null)
  const tooltip = ref(null)

  onMounted(() => {
    loadAndDraw()
  })

  watch(
    () => props.satelliteData,
    () => loadAndDraw(),
    { immediate: true }
  )

  function loadAndDraw() {
    d3.json('/countries.geo.json')
      .then(geoData => drawMap(geoData))
      .catch(err => console.error('Error al cargar countries.geo.json', err))
  }

  function drawMap(geoData) {
    // 1) Borrar todo previo
    d3.select(mapContainer.value).selectAll('*').remove()

    // 2) Dimensiones
    const containerWidth = mapContainer.value.clientWidth
    const containerHeight = mapContainer.value.clientHeight

    const margin = { top: 10, right: 10, bottom: 10, left: 10 }
    const width = containerWidth - margin.left - margin.right
    const height = containerHeight - margin.top - margin.bottom

    // 3) SVG
    // Cambia el color de fondo del SVG a un tono oscuro (ej: #121212 o #1e1e1e)
    const svg = d3
      .select(mapContainer.value)
      .append('svg')
      .attr('width', containerWidth)
      .attr('height', containerHeight)
      .style('background-color', '#121212') // Fondo oscuro del "océano"

    // 4) Proyección
    const projection = d3.geoMercator().fitExtent(
      [
        [margin.left, margin.top],
        [width, height]
      ],
      geoData
    )

    const path = d3.geoPath().projection(projection)

    // 5) Grupo principal
    const mainGroup = svg.append('g').attr('class', 'main-group')

    // 6) Paises
    // Ajusta colores de relleno y trazo para que destaquen sobre el fondo oscuro.
    mainGroup
      .selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', path)
      .attr('fill', '#2a2a2a') // color gris oscuro para los países
      .attr('stroke', '#444444') // trazo un poco más claro
      .attr('stroke-width', 0.5)
      .on('mouseover', function () {
        d3.select(this).transition().duration(200).attr('fill', '#404040') // aclaramos un poco al pasar el ratón
      })
      .on('mouseout', function () {
        d3.select(this).transition().duration(200).attr('fill', '#2a2a2a')
      })

    // 7) Grupo para satélites
    const satGroup = mainGroup.append('g').attr('class', 'satellite-group')

    // 8) Satélites
    satGroup
      .selectAll('.satellite')
      .data(props.satelliteData)
      .enter()
      .append('circle')
      .attr('class', 'satellite')
      .attr('r', 5)
      .attr('fill', '#ff5722') // naranja Starlink
      .attr('stroke', '#fff') // borde blanco
      .attr('stroke-width', 0.5)
      .attr('cx', d => {
        const coords = projection([d.longitude, d.latitude])
        return coords ? coords[0] : 0
      })
      .attr('cy', d => {
        const coords = projection([d.longitude, d.latitude])
        return coords ? coords[1] : 0
      })
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('fill', '#bf360c')
          .attr('r', 7)

        // Tooltip
        const infoHtml = `
        <div class="tooltip-content">
          <div><strong>ID:</strong> ${d.id}</div>
          <div><strong>Lat:</strong> ${d.latitude.toFixed(2)}&deg;</div>
          <div><strong>Lon:</strong> ${d.longitude.toFixed(2)}&deg;</div>
          <div><strong>Altura:</strong> ${d.height_km.toFixed(2)} km</div>
        </div>
      `

        d3.select(tooltip.value)
          .style('opacity', 1)
          .style('left', event.clientX + 15 + 'px')
          .style('top', event.clientY + 15 + 'px')
          .html(infoHtml)
      })
      .on('mousemove', function (event) {
        d3.select(tooltip.value)
          .style('left', event.clientX + 15 + 'px')
          .style('top', event.clientY + 15 + 'px')
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('fill', '#ff5722')
          .attr('r', 5)

        d3.select(tooltip.value).style('opacity', 0)
      })

    // 9) Zoom
    const zoom = d3
      .zoom()
      .scaleExtent([1, 8])
      .on('zoom', event => {
        mainGroup.attr('transform', event.transform)
      })

    svg.call(zoom)
  }
</script>

<style scoped>
  .starlink-map-container {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Roboto', sans-serif;
    /* Si tienes un header fijo, es mejor usar calc(100vh - alturaDelHeader), etc. */
  }

  .map-container {
    /* Ajusta según tu diseño. Probar con altura fija si 100vh falla */
    width: 100%;
    height: 600px;
    position: relative;
    /* border: 1px solid #ccc; */
  }

  /* 
     Usamos position: fixed para descartar recortes
     y un z-index alto para estar encima de todo.
  */
  .tooltip {
    position: fixed;
    pointer-events: none;
    background-color: rgba(50, 50, 50, 0.9);
    color: #fff;
    padding: 0.7rem 1rem;
    border-radius: 6px;
    font-size: 0.9rem;
    opacity: 0; /* Inicia invisible */
    transition: opacity 0.2s;
    z-index: 99999;
    box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.3);
  }

  /* Opcional: mini flecha para el tooltip */
  .tooltip::after {
    content: '';
    position: absolute;
    border-width: 6px;
    border-style: solid;
    border-color: rgba(50, 50, 50, 0.9) transparent transparent transparent;
    top: 0; /* Ajusta la flecha arriba o abajo según prefieras */
    left: 0.8rem;
    transform: translateY(-100%);
  }
</style>
