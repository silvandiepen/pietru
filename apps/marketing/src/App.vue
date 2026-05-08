<template>
  <RouterView />
</template>

<script lang="ts" setup>
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

html {
  background: var(--pietru-color-background);
}

body {
  margin: 0;
  min-width: 320px;
  font-family: var(--pietru-font-family-base);
  font-size: 16px;
  line-height: 1.6;
  font-weight: 400;
  background: var(--pietru-color-background);
  color: var(--pietru-color-text);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

* {
  box-sizing: border-box;
}

a {
  color: var(--pietru-color-accent);
}

button,
input,
textarea,
select {
  font: inherit;
}
</style>
