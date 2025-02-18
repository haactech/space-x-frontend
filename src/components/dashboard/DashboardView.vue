<template>
    <div class="dashboard">
      <div v-if="loading" class="loading">Cargando datos...</div>
      
      <div v-if="error" class="error">{{ error }}</div>
  
      <div v-if="dashboardData" class="content">
        <div class="metrics-grid">
          <div class="card">
            <h3>Lanzamientos totales</h3>
            <p>{{ dashboardData.summary_metrics.total_launches }}</p>
          </div>
          <div class="card">
            <h3>Tasa de éxito</h3>
            <p>{{ dashboardData.summary_metrics.success_rate }}%</p>
          </div>
          <div class="card">
            <h3>Cohetes activos</h3>
            <p>{{ dashboardData.summary_metrics.active_rockets }}</p>
          </div>
          <div class="card">
            <h3>Satélites Starlink</h3>
            <p>{{ dashboardData.summary_metrics.total_starlink_satellites }}</p>
          </div>
        </div>
  
        <!-- Comparación de cohetes -->
        <div class="section">
          <h2>Comparación de Cohetes</h2>
          <div class="columns">
            <!-- Especificaciones -->
            <div class="column">
              <h3>Especificaciones técnicas</h3>
              <table>
                <thead>
                  <tr>
                    <th>Cohete</th>
                    <th>Altura (m)</th>
                    <th>Masa (kg)</th>
                    <th>Costo por lanzamiento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rocket in dashboardData.rocket_comparison.specifications" :key="rocket.name">
                    <td>{{ rocket.name }}</td>
                    <td>{{ rocket.height_m }}</td>
                    <td>{{ rocket.mass_kg }}</td>
                    <td>${{ rocket.cost_per_launch.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
  
            <!-- Tasas de éxito -->
            <div class="column">
              <h3>Tasas de éxito</h3>
              <table>
                <thead>
                  <tr>
                    <th>Cohete</th>
                    <th>Lanzamientos exitosos</th>
                    <th>Tasa de éxito</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="rate in dashboardData.rocket_comparison.success_rates" :key="rate.name">
                    <td>{{ rate.name }}</td>
                    <td>{{ rate.successful_launches }}/{{ rate.total_launches }}</td>
                    <td>{{ rate.rate }}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
  
            <!-- Métricas de lanzamiento -->
            <div class="section">
            <h2>Estadísticas de Lanzamientos</h2>
            <div class="columns">
                <!-- Columna izquierda: Tabla existente -->
                <div class="column">
                <h3>Por año</h3>
                <table>
                    <thead>
                    <tr>
                        <th>Año</th>
                        <th>Total</th>
                        <th>Exitosos</th>
                        <th>Tasa</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr v-for="year in dashboardData.launch_metrics.by_year" :key="year.year">
                        <td>{{ year.year }}</td>
                        <td>{{ year.total }}</td>
                        <td>{{ year.successful }}</td>
                        <td>{{ year.rate }}%</td>
                    </tr>
                    </tbody>
                </table>
                </div>

                <div class="column">
                <h3>Frecuencia de Lanzamientos</h3>
                <LaunchChart 
                    :data="dashboardData.launch_metrics.frequency_data"
                />
                </div>
            </div>
            </div>  
  
        <!-- Datos Starlink -->
        <div class="section">
          <h2>Datos Starlink</h2>
          <div v-for="param in dashboardData.starlink_data.orbital_parameters" :key="param.version">
            <h3>Versión {{ param.version }}</h3>
            <p>Satélites: {{ param.count }}</p>
            <p>Altura promedio: {{ param.average_height_km }} km</p>
            <p>Velocidad promedio: {{ param.average_velocity_kms }} km/s</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue'
  import LaunchChart from './LaunchChart.vue'
  
  const dashboardData = ref(null)
  const loading = ref(true)
  const error = ref(null)
  
  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/dashboard/')
      if (!response.ok) throw new Error('Error fetching data')
      dashboardData.value = await response.json()
    } catch (err) {
      error.value = err.message || 'Error al cargar los datos'
    } finally {
      loading.value = false
    }
  }
  
  onMounted(() => {
    fetchDashboardData()
  })
  </script>
  
  <style scoped>
  .dashboard {
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .loading, .error {
    padding: 20px;
    text-align: center;
    font-size: 1.2em;
  }
  
  .error {
    color: #ff4444;
  }
  
  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }
  
  .card {
    padding: 20px;
    border-radius: 8px;
    text-align: center;
  }
  
  .card h3 {
    margin-top: 0;
    color: #333;
  }
  
  .card p {
    font-size: 1.5em;
    margin: 10px 0;
    font-weight: bold;
  }
  
  .section {
    margin: 40px 0;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .columns {
    display: flex;
    gap: 20px;
  }
  
  .column {
    flex: 1;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 10px;
  }
  
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  
  
  </style>