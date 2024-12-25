<template>
  <div class="div">
    <HelloWorld msg="qwdqwd" />

    <ui-button label="Button Primary" />

    <ui-button label="qwed"> Qweu </ui-button>

    <ui-input />

    <lazy-ui-textarea />
  </div>
</template>

<script lang="ts" setup>
import HelloWorld from './HelloWorld.vue'
import UiInput from '../shared/UiInput/UiInput.vue'
import { defineAsyncComponent, hydrateOnVisible } from 'vue'

const LazyUiTextarea = defineAsyncComponent({
  loader: () => import('../shared/UiTextarea/UiTextarea.vue'),
  hydrate: hydrateOnVisible(),
})
</script>
