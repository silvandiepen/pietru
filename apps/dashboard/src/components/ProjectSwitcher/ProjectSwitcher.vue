<template>
  <label class="project-switcher">
    <span class="project-switcher__label">Project</span>
    <div class="project-switcher__wrapper">
      <select class="project-switcher__control" :value="modelValue || ''" @change="onChange">
        <option disabled value="">{{ $t('projectSwitcher.placeholder') }}</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>
      <svg class="project-switcher__chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
    </div>
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
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  &__wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  &__control {
    width: 100%;
    padding: 0.65rem 2.2rem 0.65rem 0.85rem;
    border: none;
    border-radius: var(--pietru-radius-sm);
    background: var(--pietru-color-navy);
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 500;
    appearance: none;
    cursor: pointer;

    &:focus {
      outline: 2px solid var(--pietru-color-accent);
      outline-offset: 1px;
    }

    option {
      background: var(--pietru-color-surface);
      color: var(--pietru-color-text);
    }
  }

  &__chevron {
    position: absolute;
    right: 0.75rem;
    color: rgba(255, 255, 255, 0.7);
    pointer-events: none;
  }
}
</style>
