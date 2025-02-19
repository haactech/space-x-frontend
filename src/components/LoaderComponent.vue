<template>
  <div class="loader-container">
    <div class="loader">
      <div class="rocket">🚀</div>
    </div>
    <p class="loading-text">Loading...</p>
  </div>
</template>

<style scoped>
  .loader-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 200px;
    color: #fff;
  }

  .loader {
    width: 100px;
    height: 100px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .rocket {
    font-size: 2rem;
    animation: launch 2s infinite;
  }

  .loading-text {
    margin-top: 1rem;
    font-size: 1.1rem;
    color: hsla(160, 100%, 37%, 1);
  }

  @keyframes launch {
    0% {
      transform: translateY(0) rotate(0deg);
    }
    50% {
      transform: translateY(-20px) rotate(5deg);
    }
    100% {
      transform: translateY(0) rotate(0deg);
    }
  }
</style>
