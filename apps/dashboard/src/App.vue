<template>
  <RouterView />
</template>

<script lang="ts" setup>
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
@import './styles/tokens';

:root {
  color: var(--pietru-color-text);
  background: var(--pietru-color-background);
  font-family: var(--pietru-font-family-base);
  font-size: 16px;
  line-height: 1.6;
  font-weight: 400;
  color-scheme: light;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--pietru-color-background);
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--pietru-color-background);
  color: var(--pietru-color-text);
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input,
select,
textarea {
  font: inherit;
}

button,
input,
select,
textarea {
  color: inherit;
}

#app {
  background: var(--pietru-color-background);
}
</style>
