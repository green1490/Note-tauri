<template>
    <div
      @click.left="clicked"
      @mouseenter="hover = true"
      @mouseleave="hover = false"
      :style="{ 'margin-left': `${depth * 10}px` }"
      class="node"
      :class="{ 'node-hover': hover }"
    >
      <span v-if="directory && directory != undefined">
        <font-awesome-icon v-if="expanded" icon="fa-solid fa-folder-open fa-lg" />
        <font-awesome-icon v-else icon="fa-solid fa-folder fa-lg" />
      </span>
      {{ name }}
    </div>
    <div v-if="expanded">
      <Filebrowser
      v-for="(child, index) in node?.children"
      :key="index"
      :node="child"
      :depth="depth + 1"
    />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { TreeNode } from './class/TreeNode'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { invoke } from '@tauri-apps/api/tauri'
import { emit } from '@tauri-apps/api/event'

const props = defineProps({
node: TreeNode,
root: String,
depth: {
    type: Number,
    default: 0
}
})
const hover = ref(false)
const expanded = ref(false)
const name = ref<string>()
const isDir = ref<boolean>()

onMounted(async () => {
    name.value = await props.node?.fileName()
    if (props.node) {
      isDir.value = await invoke('is_dir',{path: props.node.path})
    }
})

//   const contextMenu = () => {
//     ipcRenderer.send('context-menu', props.node?.path, props.root)
//   }

const clicked = async () => {
    expanded.value = !expanded.value
    if (props.node?.path) {
        let isDir:boolean = await invoke("is_dir", {path:props.node.path})
        if(!isDir && props.node.path) {
          await invoke('set_path', {
            path: props.node.path
          })  
          if (props.node.content === undefined) {
                emit('read-file', {
                    path: props.node.path,
                    fileName: await props.node.fileName()
                })
            } else {
                await invoke('change_file', {
                    path: props.node.path,
                    fileName:await props.node.fileName(),
                    content:props.node.content
                })
            }
        }
    }
}

const directory = computed < Boolean | undefined >(() => {
if (props.node?.path === undefined) {
    return undefined
} else {
    return isDir.value
}
})
</script>

  <style scoped>
  .node {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  
  .node-hover {
    cursor: pointer;
    background-color: #3d3b3b;
  }
  </style>
  