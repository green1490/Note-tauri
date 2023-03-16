import { sep } from '@tauri-apps/api/path'


export class TreeNode {
  path: string
  children: Array<TreeNode>
  content: string | undefined

  constructor(path: string, childs:TreeNode[] = []) {
    this.path = path
    this.children = childs
    this.content = undefined
  }

  public fileName(): string {
    return this.path.split(sep).at(-1) as string
  }

  node(path:string,node:TreeNode):TreeNode | undefined {
    if (node.path == path) {
      return node
    } else {
      node.children.forEach((node) => {
        this.node(path,node)
      })
    }
  }
}
