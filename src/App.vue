<script setup lang="ts">
import { onMounted, ref } from 'vue';
import Sidebar from './components/Sidebar.vue'
import Dock from './components/Dock.vue'
import Filebrowser from './components/Filebrowser.vue';
import Editor from './components/Editor.vue'
import Menu from './components/Menu.vue';
import ContextMenu from './components/ContextMenu.vue'
import { readDir } from '@tauri-apps/api/fs'
import { listen,  } from '@tauri-apps/api/event'
import { TreeNode } from './components/class/TreeNode';
import { invoke } from '@tauri-apps/api/tauri';
import { marked } from 'marked'
import { sep } from '@tauri-apps/api/path'
import { register } from '@tauri-apps/api/globalShortcut'
import {File,FileContent, ContextData} from './components/interface/index'

const contextPath = ref<string>()
const currentMarkdownContent = ref<string>()
const isInMarkdownMode = ref<boolean>(false)
const currentNode = ref<TreeNode>()
const node = ref<TreeNode | undefined>(undefined)
const currentLayout = ref('"side browser menu"\n"side browser area"\n"dock dock dock"')
const path = ref<string | undefined>(undefined)
const sidepanelOpened = ref(true)
const isFileClosed = ref<boolean>(true)
const offsetx = ref<number>(0);
const offsety = ref<number>(0);
const isContextMenuShown = ref<boolean>(false)

const tree = async (rootPath: string) => {
  const root = new TreeNode(rootPath)
  const stack = [root]

  while (stack.length) {
    const node = stack.pop()
    if (node) {
      const entries = await readDir(node.path)
      for (let entry of entries) {
        const childNode = new TreeNode(entry.path)
        node.children.push(childNode)
        if (entry.children) {
          stack.push(childNode)
        }
      }
    }
  }
  return root
}

const insertNode = (tree: TreeNode, path: string, nodeName: string) => {
  if (tree.path === path) {
    tree.children.push(new TreeNode(`${path}${sep}${nodeName}`))
  } else {
    const children = tree.children
    children.forEach((node) => {
      insertNode(node, path, nodeName)
    })
  }
}

const removeNode = (tree: TreeNode, path: string) => {
  const child = tree.children
  const fileIndex = child.findIndex((node, index): boolean => {
    if (node.path === path) {
      return true
    }
    return false
  })

  if (fileIndex !== -1) {
    child.splice(fileIndex, 1)
  } else {
    child.forEach((node) => {
      removeNode(node, path)
    })
  }
}

const newPath = async (newPathValue?:string) => {
  path.value = newPathValue
  if (newPathValue) {
    node.value = await tree(newPathValue)
  }
}

const change = () => {
  sidepanelOpened.value = !sidepanelOpened.value
  if (sidepanelOpened.value === true) {
    const openedSide = '"side browser menu"\n"side browser area"\n"dock dock dock"'
    currentLayout.value = openedSide
  } else {
    const collapsedSide = '"side menu menu"\n"side area area"\n"dock dock dock"'
    currentLayout.value = collapsedSide
  }
}

const getNode = (tree: TreeNode, path:string) => {
  const queue:TreeNode[] = []
  tree.children.forEach((node) => {
    queue.push(node)
  })

  for (const node of queue) {
    if (node.path === path) {
      return node
    }
    node.children.forEach((node) => {
      queue.push(node)
    })
  }

  return undefined
}

const instertConent = (tree: TreeNode, path: string, content:string) => {
  const node = getNode(tree, path)
  if (node) {
    node.content = content
  }
  return node
}

const updateEditor = (text:string) => {
  if (currentNode.value) {
    if (currentNode.value?.content === undefined) {
      currentNode.value.content = ''
      invoke('text_change',{
        content: ''
      })
    } else {
      currentNode.value.content = text
      invoke('text_change',{
        content: text
      })
    }
  }
}

const closeFile = () => {
  isFileClosed.value = true
  currentNode.value = undefined
}


const replaceEditor = () => {
  isInMarkdownMode.value = !isInMarkdownMode.value

  if (isInMarkdownMode.value) {
    if (currentNode.value?.content) {
      currentMarkdownContent.value = marked.parse(currentNode.value.content)
    }
  } else {
    currentMarkdownContent.value = currentNode.value?.content
  }
}

const hideContextMenu = (event:any) => {
  event.preventDefault();
  let rect = event.currentTarget.getBoundingClientRect();
  let x = event.clientX - rect.left;
  let y = event.clientY - rect.top;
  //200 = width   of the context menu
  //100 = height  of the context menu
  if ((x < offsetx.value || offsetx.value+200 < x) ||
    (y < offsety.value || offsety.value+100 < y))
  isContextMenuShown.value = false
}

const newNode = (newNode:{path:string,nodeName:string}) => {
  isContextMenuShown.value = false
  if (node.value !== undefined) {
    insertNode(node.value, newNode.path, newNode.nodeName)
  }
}

const deleteNode = (deletedNode:{path:string,isCurrentPathExits:boolean}) => {
  isContextMenuShown.value = false
  if (node.value) {
    removeNode(node.value, deletedNode.path)
    if (!deletedNode.isCurrentPathExits) {
      currentNode.value = undefined
      isFileClosed.value = true
    }
  }
}

onMounted(async () => {
  await register('CommandOrControl+S', () => {
    if (currentNode.value?.content)
    invoke('save_to_file', {
      path:currentNode.value.path,
      content:currentNode.value.content
    })
  });
})

listen<File>('front-read-file', (event)=> {
  if(node.value) {
    isFileClosed.value = false
    currentNode.value = instertConent(node.value, event.payload.path.toString(), event.payload.content.toString())
    if (currentNode.value?.content && currentNode.value.path) {
      currentNode.value.content = event.payload.content.toString()
      currentNode.value.path = event.payload.path.toString()
    }
    if (isInMarkdownMode.value) {
      currentMarkdownContent.value = marked.parse(event.payload.content.toString())
    }
  }
})

listen<FileContent>('change-file', (event) => {
  if (node.value) {
    isFileClosed.value = false
    currentNode.value = getNode(node.value, event.payload.path)
    if (currentNode.value?.content) {
      currentNode.value.content = event.payload.content
    }
    if (isInMarkdownMode.value) {
      currentMarkdownContent.value = marked.parse(event.payload.content.toString())
    }
  }
})

listen<ContextData>('show-context', (event) => {
  isContextMenuShown.value = true
  offsetx.value = event.payload.offsetx
  offsety.value = event.payload.offsety
  contextPath.value = event.payload.contextPath
})
</script>

<template>
  <!-- Ezt átírni firebrowserre
  és ctrl+s-ni lehessen a fájlokat -->
  <div class="cont"
    @click.left="hideContextMenu">
    <div class="sidebar">
        <Sidebar @toggle="change" @path-selected="newPath"/>
    </div>
    <div class="dock">
      <Dock/>
    </div>
    <div class="menu">
      <Menu :closed="isFileClosed" @close="closeFile" :mark-down="isInMarkdownMode" @change-mode="replaceEditor" :current-file="(currentNode)? currentNode.fileName() : ''"/>
    </div>
    <div class="editor">
      <Editor :closed="isFileClosed" @update="updateEditor" :mode="isInMarkdownMode" :file="(isInMarkdownMode) ? currentMarkdownContent : currentNode?.content "/>
    </div>
    <div v-show="sidepanelOpened" class="browser" >
      <Filebrowser v-if="node != undefined" :node="node" :root="path"/>
    </div>
    <div class="context" :style="{
      'top':offsety+'px',
      'left':offsetx+'px'}"
      v-show="isContextMenuShown"
      >
      <ContextMenu @delete-node="deleteNode" :root-path="node?.path" @new-node="newNode" :context-path="contextPath"/>
    </div>
  </div>
</template>

<style>
.context {
  position: absolute;
  width: 200px;
  height: 100px;
}

.cont {
  grid-template-areas: v-bind('currentLayout');
}

.cont {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: 50px 200px 1fr;
  grid-template-rows: 35px 1fr 25px;
}

.editor{
  grid-area: area;
  margin-top: 5px;
}

.dock {
  grid-area: dock;
}

.sidebar {
  background-color: black;
  grid-area: side;
}

.sidebar {
  background-color: black;
  grid-area: side;
}


.browser {
  color: white;
  background-color: #131315;
}

.browser {
  padding-top: 3rem;
  padding-left: 1rem;
}

.browser {
  overflow-y: scroll;
  overflow-x: hidden;
  grid-area: browser;
}

.menu {
  grid-area: menu;
}

.browser::-webkit-scrollbar {
  display: none;
}
</style>
