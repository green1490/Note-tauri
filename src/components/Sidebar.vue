<script setup lang="ts">
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { open } from '@tauri-apps/api/dialog'
import { writeTextFile,readTextFile } from '@tauri-apps/api/fs';
import { BaseDirectory, configDir } from '@tauri-apps/api/path';

const emit = defineEmits(['path-selected', 'toggle', 'sync-path'])

const fileBrowser = async () => {
  const path = await open({
    directory:true
  })
  emit('path-selected', path)

  if(path && typeof path == 'string') {
    await writeTextFile({ path: 'app.conf', contents: path }, { dir: BaseDirectory.Config });
  }

}
const collapse = () => {
  emit('toggle')
}
</script>

<template>
  <div class="container icon">
    <div>
      <button class="btn btn-outline-dark" @click="collapse">
        <font-awesome-icon
          class="fa fa-lg"
          icon="fa-solid fa-arrow-right-arrow-left"/>
      </button>
      <button @click="fileBrowser" class="btn btn-outline-dark">
        <font-awesome-icon
          class="fa fa-lg"
          icon="fa-solid fa-folder"/>
      </button>
      <!-- <button @click="sync" class="btn btn-outline-dark">
        <font-awesome-icon
          class="fa fa-lg"
          icon="fa-solid fa-sync" />
      </button> -->
    </div>
    <div>
      <!-- <button class="btn btn-outline-dark">
        <font-awesome-icon
          class="fa fa-lg"
          icon="fa-solid fa-gear" />
      </button> -->
    </div>
  </div>
</template>

<style scoped>
.icon {
  color: white;
}

.container {
  display: grid;
  grid-template-rows: 0.1fr 3fr 0.4fr;
  justify-content: center;
}

.container {
  height: 100%;
  width: 100%;
}

.fa {
  color: white;
}
</style>