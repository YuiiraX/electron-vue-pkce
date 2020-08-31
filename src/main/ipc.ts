import { log } from './logger'
import { AuthFlow, AuthStateEmitter } from './auth/flow'
import { ipcRenderer } from 'electron'

export class IpcRegistry {
  static ipcMain: Electron.IpcMain | null
  private static authFlow: AuthFlow

  static onAuthRequest(event: Electron.IpcMainEvent) {
    log('Making new Auth Request')

    // Handle Authentication
    IpcRegistry.authFlow.fetchServiceConfiguration().then(() => {
      IpcRegistry.authFlow.makeAuthorizationRequest()
    })

    IpcRegistry.authFlow.authStateEmitter.on(
      AuthStateEmitter.ON_TOKEN_RESPONSE,
      () => {
        // Response with auth tokens
        IpcRegistry.authFlow.performWithFreshTokens().then(response => {
          event.reply('auth-response', {
            accessToken: response
          })
        })
      }
    )
  }

  static onNewTokenRequest(event: Electron.IpcMainEvent) {
    if (IpcRegistry.authFlow.isLoggedIn()) {
      IpcRegistry.authFlow.performWithFreshTokens().then(response => {
        event.reply('new-token-response', {
          accessToken: response
        })
      })
    } else {
      event.reply('new-token-response', {
        msg: 'no user store'
      })
    }
  }

  static register(ipcMain: Electron.IpcMain) {
    IpcRegistry.ipcMain = ipcMain
    IpcRegistry.authFlow = new AuthFlow()

    IpcRegistry.ipcMain.on('auth-request', IpcRegistry.onAuthRequest)
    IpcRegistry.ipcMain.on('new-token-request', IpcRegistry.onNewTokenRequest)
  }
}
