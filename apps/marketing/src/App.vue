<template>
  <RouterView />
</template>

<script lang="ts" setup>
</script>

<style lang="scss">
body {
  margin: 0;
  min-width: 320px;
  font-family: var(--pietru-font-family-base);
  background: var(--pietru-color-surface);
  color: var(--pietru-color-text);
}

* {
  box-sizing: border-box;
}

a {
  color: inherit;
}
</style>
