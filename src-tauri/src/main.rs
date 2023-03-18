#![allow(non_snake_case)]
// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::{fs::metadata, sync::{Mutex},fs::read_to_string};
use serde::{Serialize,Deserialize};
use tauri::{Manager, AppHandle};
use tauri::State;

//path, currentFileContent, contextPath
#[derive(Debug,Default)]
struct Glob(
    Mutex<String>,
    Mutex<String>,
    Mutex<String>);


#[derive(Serialize,Deserialize,Debug)]
struct ReadFile {
    path: String,
    fileName: String
}

#[derive(Serialize,Clone)]
struct ReadFileWithContent {
    path: String,
    fileName: String,
    content: String
}

#[derive(Clone,Serialize)]
struct Payload {
    content:String,
    path:String
}

#[derive(Clone,Serialize)]
struct ContextData {
    contextPath:String,
    offsetx:i32,
    offsety:i32
}

#[tauri::command]
fn show_context(contextPath:String,offsetx:i32, offsety:i32, state: State<Glob>, app:AppHandle) {
    *state.2.lock().unwrap() = contextPath.clone();
    app.emit_all("show-context", ContextData {
        contextPath,
        offsetx,
        offsety
    }).unwrap();
    
}

#[tauri::command]
fn text_change(content:String, state: State<Glob>) {
    *state.1.lock().unwrap() = content
}

#[tauri::command]
fn change_file(path: String, fileName: String, content: String,state: State<Glob>,app:AppHandle) {
    *state.0.lock().unwrap() = path.clone();
    *state.1.lock().unwrap() = content.clone();

    app.emit_all("change-file", ReadFileWithContent{
        content,
        path,
        fileName
    }).unwrap();
}

#[tauri::command]
fn set_path(path: String,state: State<Glob>) {
    *state.0.lock().unwrap() = path;
}

#[tauri::command]
fn is_dir(path:String) -> bool {
    metadata(path).unwrap().is_dir()
}


fn main() {
    tauri::Builder::default()
        .manage(Glob{..Default::default()})
        .invoke_handler(tauri::generate_handler![
            is_dir,
            set_path,
            change_file,
            text_change,
            show_context
        ])
        .setup(|app| {
            let app_ = app.handle();
            app.listen_global("read-file", move |event| {
                let file:ReadFile = serde_json::from_str(event.payload().unwrap()).unwrap();
                let content = read_to_string(&file.path).unwrap();
                
                app_.emit_all("front-read-file",Payload {
                    content,
                    path:file.path
                }).unwrap();
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
