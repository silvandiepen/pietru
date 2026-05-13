<script setup lang="ts">
import { useBemm } from "bemm";
import { Badge, Section, Steps } from "@sil/ui";
import SiteLogo from "../SiteLogo.vue";

defineProps<{
  eyebrow: string;
  title: string;
  steps: Array<{
    title: string;
    description: string;
  }>;
}>();

const bemm = useBemm("home-how-it-works", { includeBaseClass: true });
</script>

<template>
  <div :class="bemm()">
    <Section :class="bemm('section')">
      <div :class="bemm('content')">
        <div :class="bemm('header', 'center')">
          <Badge variant="primary" size="small">{{ eyebrow }}</Badge>
          <h2 :class="bemm('title')">{{ title }}</h2>
        </div>
        <div :class="bemm('steps')">
          <div :class="bemm('step')" v-for="step in steps">
            <h3>{{ step.title }}</h3>
            <p>{{ step.description }}</p>
          </div>
        </div>
      </div>
    </Section>
    <div :class="bemm('visual')">
      <SiteLogo :class="bemm('logo')" />
    </div>
  </div>
</template>

<style lang="scss">
.home-how-it-works {
  background-color: var(--color-foreground);
  color: var(--color-background);
  display: flex;
  &__visual {
    width: 40vw;
    position: relative;
    background-color: color-mix(in srgb, var(--color-light), var(--color-dark) 10%);
  }

  &__logo {
    position: relative;
    width: 100%; height: 100%;
    overflow: hidden;

    svg {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 800px;
      height: 300px;
    transform: translate(-50%,-50%) rotate(90deg) scale(2);
     color: var(--color-light);

    }
  }

  &__content {
    padding: var(--spacing);

    display: flex;
    flex-direction: column;
    gap: var(--spacing);
  }

  &__header {
  }

  &__title {
  }

  &__steps {
    display: flex;
    flex-direction: column;
    gap: var(--spacing);
  }
}
</style>
