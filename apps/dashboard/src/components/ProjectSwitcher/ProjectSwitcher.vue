<template>
  <label class="project-switcher">
    <span class="project-switcher__label">Project</span>
    <select class="project-switcher__control" :value="modelValue || ''" @change="onChange">
      <option disabled value="">Select a project</option>
      <option v-for="project in projects" :key="project.id" :value="project.id">
        {{ project.name }}
      </option>
    </select>
  </label>
</template>

<script lang="ts" setup>
import type { ProjectSwitcherProps } from './ProjectSwitcher.model'

defineProps<ProjectSwitcherProps>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

function onChange(event: Event) {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<style lang="scss" scoped>
.project-switcher {
  display: grid;
  gap: 0.4rem;

  &__label {
    color: var(--pietru-color-text-muted);
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  &__control {
    min-width: 14rem;
    padding: 0.7rem 0.9rem;
    border: 1px solid var(--pietru-color-border);
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-panel);
    color: var(--pietru-color-text);
  }
}
</style>
