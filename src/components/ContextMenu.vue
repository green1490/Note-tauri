<script setup lang="ts">
import { save } from '@tauri-apps/api/dialog'
import { dirname,extname, basename } from '@tauri-apps/api/path'
import { exists,writeTextFile,createDir,removeDir,removeFile } from '@tauri-apps/api/fs'
import { invoke } from '@tauri-apps/api/tauri';

const prop = defineProps<{
    contextPath:String | undefined,
    rootPath:String | undefined
}>()

const emit = defineEmits([
    'new-node',
    'delete-node'
])

const newFolder = async () => {
    if (prop.contextPath) {
        let saveDir = await dirname(prop.contextPath.toString())
        let isDir:boolean = await invoke('is_dir', {
            path:prop.contextPath
        })

        if (isDir) {
            let userDireName = await save({
                defaultPath: prop.contextPath.toString(),
            })

            if (userDireName) {
                createDir(userDireName)
                emit('new-node', {
                    path:prop.contextPath.toString(),
                    nodeName:await basename(userDireName)
                })
            }
        }
    }
}

const newFile = async () => {
    if (prop.contextPath) {
        console.log(prop.contextPath)
        let isDir:boolean = await invoke('is_dir', {
            path:prop.contextPath
        })

        if (isDir) {
            let userFileName = await save({
                defaultPath: prop.contextPath.toString(),
            })
            if (userFileName) {
                try {
                    if ('md' === await extname(userFileName)) {
                        writeTextFile(userFileName,'')
                        let name:string = await basename(userFileName)
                        emit('new-node', {
                            path:prop.contextPath.toString(),
                            nodeName:name
                        })
                    }
                    console.log(`${await basename(userFileName)}`)
                } catch (err) {
                    userFileName = userFileName + '.md'
                    writeTextFile(userFileName,'')
                    let name:string = await basename(userFileName)
                    emit('new-node', {
                        path:prop.contextPath.toString(),
                        nodeName:name
                    })
                }
            }

        }
    }
}
const deleteNode = async () => {
    if (prop.rootPath != prop.contextPath) {
        if (await invoke('is_dir',{
            path:prop.contextPath
        })) {
            if (prop.contextPath) {
                await removeDir(prop.contextPath.toString())
            }
        } else {
            if (prop.contextPath) {
                await removeFile(prop.contextPath.toString())
            }
        }

        if (prop.contextPath) {
            emit('delete-node', {
                path: prop.contextPath,
                isCurrentPathExits:await exists(prop.contextPath.toString())
            })    
        }
    }
}
</script>

<template>
    <div class="container-fluid text-bg-dark p-3">
        <p @click="newFolder" class="con">New folder</p>
        <p @click="newFile" class="con">New file</p>
        <p @click="deleteNode" class="con">Delete</p>
    </div>
</template>

<style scoped>
.con:hover {
    background-color: darkslategrey;
}
</style>