<script setup lang="ts">
  import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <RouterLink to="/" class="nav-link">Dashboard</RouterLink>
      <RouterLink to="/rockets-and-launches" class="nav-link"
        >Rockets & Launches</RouterLink
      >
      <RouterLink to="/starlink" class="nav-link">Starlink</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style>
  .app-container {
    min-height: 100vh;
    background-color: #121212;
  }

  .navbar {
    background-color: #1e1e1e;
    padding: 1rem 2rem;
    display: flex;
    gap: 2rem;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  }

  .nav-link {
    color: #eee;
    text-decoration: none;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    transition: background-color 0.3s ease;
  }

  .nav-link:hover {
    background-color: #2c2c2c;
  }

  .router-link-active {
    background-color: hsla(160, 100%, 37%, 0.2);
    color: hsla(160, 100%, 37%, 1);
  }
</style>
