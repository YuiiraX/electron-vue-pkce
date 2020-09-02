import { log } from './logger'
import { AuthFlow } from './auth/flow'

export class IpcRegistry {
  static ipcMain: Electron.IpcMain | null
  private static authFlow: AuthFlow

  static onAuthRequest() {
    log('Making new Auth Request')

    // Handle Authentication
    IpcRegistry.authFlow.fetchServiceConfiguration().then(() => {
      IpcRegistry.authFlow.makeAuthorizationRequest()
    })
  }

  static onNewTokenRequest(event: Electron.IpcMainEvent) {
    if (IpcRegistry.authFlow.isLoggedIn()) {
      IpcRegistry.authFlow
        .performWithFreshTokens()
        .then((response: string) => {
          event.reply('new-token-response', {
            status: 'ok',
            accessToken: response
          })
        })
        .catch((error: string | Error) => {
          event.reply('new-token-response', {
            status: 'error',
            msg: error
          })
        })
    } else {
      event.reply('new-token-response', {
        status: 'error',
        msg: 'no user store'
      })
    }
  }

  static onSignOutRequest(event: Electron.IpcMainEvent) {
    if (IpcRegistry.authFlow.isLoggedIn()) {
      IpcRegistry.authFlow.signOut()
      event.reply('sign-out-response', {
        status: 'ok'
      })
    } else {
      event.reply('sign-out-response', {
        msg: 'no user store'
      })
    }
  }

  static register(ipcMain: Electron.IpcMain, authFlow: AuthFlow) {
    IpcRegistry.ipcMain = ipcMain
    IpcRegistry.authFlow = authFlow

    IpcRegistry.ipcMain.on('auth-request', IpcRegistry.onAuthRequest)
    IpcRegistry.ipcMain.on('new-token-request', IpcRegistry.onNewTokenRequest)
    IpcRegistry.ipcMain.on('sign-out-request', IpcRegistry.onSignOutRequest)
  }
}
