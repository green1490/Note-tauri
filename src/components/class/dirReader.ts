import { readDir } from '@tauri-apps/api/fs'
import { sep, join } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/tauri'

export const dirReader = async (path:string) => {
    const files = await readDir(path)
    const childFiles:string[] = []
    for (let item of files) {
        if (item.name) {
            childFiles.push(item.name)
        }
    }
    const dirs:string[] = [path]

    for(let i = 0;i < childFiles.length;i++) {
        childFiles[i] = await join(path,sep,childFiles[i])
    }

    const stack:string[] = childFiles
    while (stack.length) {
        const currentStackItem = stack.pop()


        if (await invoke('is_dir',{path:currentStackItem}) && currentStackItem) {
            dirs.push(currentStackItem)
            const files = await readDir(currentStackItem)
            const childFiles:string[] = []
            for (let item of files) {
                if (item.name) {
                    childFiles.push(item.name)
                }
            }
            childFiles.forEach(async (file) => {
                stack.push(await join(currentStackItem,sep,file))
            })
        }
    }
    return dirs
}