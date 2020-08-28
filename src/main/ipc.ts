import { log } from './logger'

export class IpcRegistry {
  static ipcMain: Electron.IpcMain | null

  static onAuthRequest(event: Electron.IpcMainEvent) {
    log('Testing IPC connectivity')

    // Handle Authentication

    // Response with auth tokens
    event.reply('auth-response', {
      accessToken: '0000-0000-0000-0000'
    })
  }

  static register(ipcMain: Electron.IpcMain) {
    IpcRegistry.ipcMain = ipcMain
    IpcRegistry.ipcMain.on('auth-request', IpcRegistry.onAuthRequest)
  }
}
