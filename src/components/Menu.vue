<script setup lang="ts">
import { theme } from '../theme'

const props = defineProps<{
  currentFile: string,
  markDown: boolean,
  closed: boolean,
}>()
const changeMode = () => {
  emit('change-mode')
}
const emit = defineEmits(['change-mode', 'close'])

</script>

<template>
    <div v-show="!closed" class="container-fluid menu">
      <div class="row align-items-center">
        <div class="col-9">{{ currentFile }}</div>
        <div class="col text-right">
          <button @click="changeMode" class="btn btn-outline-dark">
            <font-awesome-icon
              v-show="markDown == false"
              style="color: white;"
              class="fa fa-lg"
              icon="fa-solid fa-eye-slash"/>
              <font-awesome-icon
              v-show="markDown == true"
              style="color: white;"
              class="fa fa-lg"
              icon="fa-solid fa-eye"/>
          </button>
          <button @click="emit('close')" class="btn btn-outline-dark">
            <font-awesome-icon
              style="color: white;"
              class="fa fa-lg"
              icon="fa-solid fa-circle-xmark"/>
          </button>
        </div>
      </div>
    </div>
</template>

<style scoped>
.menu {
  background-color: v-bind('theme.menu.backgroundColor');
    color: v-bind('theme.menu.fontColor');
    border-bottom: 1px solid v-bind('theme.menu.borderBottomColor');
}
</style>
