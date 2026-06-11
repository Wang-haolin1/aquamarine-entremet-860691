<template>
  <div id="app">
    <Home />
  </div>
</template>

<script setup>
import Home from './views/Home.vue'
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
}

#app {
  width: 100vw;
  height: 100vh;
}
</style>
