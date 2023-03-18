export interface File {
    content: String,
    path: String
}
  
export interface FileContent {
    path: string,
    fileName: string,
    content: string
}

export interface ContextData {
  contextPath:string,
  offsetx:number,
  offsety:number
}