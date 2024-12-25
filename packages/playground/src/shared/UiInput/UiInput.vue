<template>
  <input :placeholder="props.placeholder" v-bind="$attrs" />
</template>

<script lang="ts" setup>
const props = withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: 'Hi',
  }
)
</script>
