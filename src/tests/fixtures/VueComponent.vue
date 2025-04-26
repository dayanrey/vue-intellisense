<script setup lang="ts">
import ChildComponent from './components/ChildComponent.vue'
</script>

<template>
  <div class="wrapper">
    <ChildComponent>
      <template #content>
        <span>Hello World</span>
      </template>
    </ChildComponent>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
