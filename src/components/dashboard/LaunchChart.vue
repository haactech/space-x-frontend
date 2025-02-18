<template>
    <div class="chart-container" ref="chartContainer"></div>
  </template>
  
  <script setup>
  import { ref, onMounted, watch } from 'vue'
  import * as d3 from 'd3'
  
  const props = defineProps({
    data: {
      type: Array,
      required: true
    }
  })
  
  const chartContainer = ref(null)
  
  const drawChart = () => {
    d3.select(chartContainer.value).selectAll('*').remove()
  
    const margin = { top: 20, right: 30, bottom: 30, left: 40 }
    const width = chartContainer.value.clientWidth - margin.left - margin.right
    const height = 400 - margin.top - margin.bottom
  
    const svg = d3.select(chartContainer.value)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
  
    const parseDate = d3.timeParse('%Y-%m')
    const data = props.data.map(d => ({
      date: parseDate(d.date),
      launches: d.launches
    }))
  
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date))
      .range([0, width])
  
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.launches)])
      .range([height, 0])
      .nice()
  
    const line = d3.line()
      .x(d => x(d.date))
      .y(d => y(d.launches))
      .curve(d3.curveMonotoneX)
  
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x))
  
    svg.append('g')
      .call(d3.axisLeft(y))
  
    svg.append('g')
      .attr('class', 'grid')
      .call(d3.axisLeft(y)
        .tickSize(-width)
        .tickFormat('')
      )
  
    svg.append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('fill', 'none')
      .attr('stroke', '#2563eb')
      .attr('stroke-width', 2)
      .attr('d', line)
  
    svg.selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.launches))
      .attr('r', 4)
      .attr('fill', '#2563eb')
  
    const tooltip = d3.select(chartContainer.value)
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
  
    svg.selectAll('.dot')
      .on('mouseover', (event, d) => {
        tooltip.transition()
          .duration(200)
          .style('opacity', .9)
        tooltip.html(`
          Date: ${d3.timeFormat('%B %Y')(d.date)}<br/>
          Launches: ${d.launches}
        `)
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 28) + 'px')
      })
      .on('mouseout', () => {
        tooltip.transition()
          .duration(500)
          .style('opacity', 0)
      })
  }
  
  watch(() => props.data, drawChart, { deep: true })
  
  onMounted(() => {
    drawChart()
    window.addEventListener('resize', drawChart)
  })
  </script>
  
  <style scoped>
  .chart-container {
    position: relative;
    width: 100%;
    height: 400px;
  }
  
  .grid line {
    stroke: #e5e7eb;
    stroke-opacity: 0.2;
  }
  
  .tooltip {
    position: absolute;
    padding: 8px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border-radius: 4px;
    font-size: 12px;
    pointer-events: none;
  }
  
  .line {
    filter: drop-shadow(0 1px 2px rgb(0 0 0 / 0.1));
  }
  </style>