<template>
  <RouterView />
</template>

<script lang="ts" setup>
</script>

<style lang="scss">
:root {
  color: var(--pietru-color-text);
  background: var(--pietru-color-surface);
  font-family: var(--pietru-font-family-base);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-width: 320px;
  background: var(--pietru-color-surface);
  color: var(--pietru-color-text);
}

a {
  color: inherit;
}

button,
input,
select,
textarea {
  font: inherit;
}
</style>
