import { BaseDirectory, readTextFile,exists,readDir, FileEntry, createDir, writeTextFile } from '@tauri-apps/api/fs'
import { basename,join, sep } from '@tauri-apps/api/path'
import { invoke } from '@tauri-apps/api/tauri'
import PocketBase,{Record} from 'pocketbase'
import { dirReader } from '../class/dirReader'


export class PockatController {
    private pb:PocketBase
    private syncPath:Promise<string>


    constructor(pb:PocketBase) {
        this.pb = pb
        this.syncPath = readTextFile('app.conf', {
            dir: BaseDirectory.Config
        })
    }

    async download(directories:Record[],dbFiles:Record[]) {
        const base = await basename(await this.syncPath)
        directories.forEach(async (dir:any) => {
            const syncPathRemoved = dir.path.replace(base,'')
            const dirPath = await join(await this.syncPath,syncPathRemoved)
            createDir(dirPath,{recursive:true})
            dbFiles.forEach(async (file) => {
                const fileReferences:string[] = dir.file
                if(fileReferences.includes(file.id)) {
                const filePath = await join(dirPath,sep,file.name+'.md')
                writeTextFile(filePath,file.content)
                }
            })
          })
    }
    

    async upload(dirPath:string[]) {
        const syncDir:{dir:string, files:{name:string,content:string}[]}[] | undefined = []
        for (let item of dirPath) {
            const file:{name:string,content:string}[] = []
            const result = await readDir(item)
            for (let item of result) {
                if (!(await invoke('is_dir',{path:item.path})) && item.name) {
                    const content = await readTextFile(item.path)
                    const index = item.name.indexOf('.')
                    file.push ({
                        name:item.name.substring(0,index),
                        content:content
                    })
                }
            }
            const base = await basename(await this.syncPath)
            const index = item.indexOf(base)
            const sanitizedPath = item.substring(index)
            syncDir.push({
                dir:sanitizedPath,
                files:file
            })
        }
        
        try {
            for (let dir of syncDir) {
                const resultList = await this.pb.collection('directory').getFullList(undefined , {
                    filter: `path = "${dir.dir}"`,
                });
                if (resultList.length) {
                    for (let file of dir.files) {
                        const record = await this.pb.collection('file').getFirstListItem(`name="${file.name}"`)
                        this.pb.collection('file').update(record.id,{'content':file.content})
                    }
                } else {
                    const fileIDs:string[] = []
                    const dirRecord = await this.pb.collection('directory').create({'path':dir.dir, 'file': []})
                    for (let item of dir.files) {
                        const fileRecord = await this.pb.collection('file').create({'name':item.name, 'content': item.content})
                        fileIDs.push(fileRecord.id)
                    }
                    await this.pb.collection('directory').update(dirRecord.id, {'file': fileIDs});
                }
            }
        } catch (err) {
            console.log(err)
        }
    }

    async sync() {
        await this.upload(await dirReader(await this.syncPath))
        await this.download (
            await this.pb.collection('directory').getFullList(),
            await this.pb.collection('file').getFullList()
        )
    }
}
