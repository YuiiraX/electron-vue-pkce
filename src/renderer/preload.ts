import { ipcRenderer } from 'electron'

declare global {
  interface Window {
    ipcRenderer: Electron.IpcRenderer
  }
}

window.ipcRenderer = ipcRenderer
