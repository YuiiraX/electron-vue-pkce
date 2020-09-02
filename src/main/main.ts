import * as path from 'path'

import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

import SecurityConfig from './security'
import defaultConfig, { ElectronConfig } from './config'
import { IpcRegistry } from './ipc'
import { AuthFlow } from './auth/flow'
import { log } from './logger'

const isDevelopment = process.env.NODE_ENV !== 'production'

export default class Main {
  private static config: ElectronConfig
  private static ipcMain: Electron.IpcMain
  private static authFlow: AuthFlow
  private static mainWindow: Electron.BrowserWindow | null
  private static application: Electron.App

  private static BrowserWindow: typeof BrowserWindow

  private static createWindow() {
    const config = Main.config

    Main.mainWindow = new BrowserWindow({
      width: config.width,
      height: config.height,
      webPreferences: {
        // Use pluginOptions.nodeIntegration, leave this alone
        // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
        nodeIntegration: (process.env
          .ELECTRON_NODE_INTEGRATION as unknown) as boolean,
        preload: path.join(__dirname, 'preload.js')
      }
    })

    if (process.env.WEBPACK_DEV_SERVER_URL) {
      // Load the url of the dev server if in development mode
      Main.mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string).catch(e => log(e))

      if (!process.env.IS_TEST)
        Main.mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      Main.mainWindow.loadURL('app://./index.html').catch(e => log(e))
    }

    Main.mainWindow.on('closed', Main.onClosed)
  }

  private static onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      Main.application.quit()
    }
  }

  private static onClosed() {
    // Dereference the window object.
    Main.mainWindow = null
  }

  private static onActivate() {
    if ((Main.mainWindow = null)) {
      Main.createWindow()
    }
  }

  private static async onReady() {
    // Create the browser window.
    if (isDevelopment && !process.env.IS_TEST) {
      // Install Vue Devtools
      try {
        await installExtension(VUEJS_DEVTOOLS)
      } catch (e) {
        console.error('Vue Devtools failed to install:', e.toString())
      }
    }

    Main.createWindow()
  }

  private static checkAuth() {
    if (Main.mainWindow && Main.authFlow.isLoggedIn()) {
      console.log('is authenticated sending is-auth event')
      Main.mainWindow.webContents.send('is-authenticated')
    } else {
      console.log('not authenticated')
    }
  }

  static loadURL(target: string) {
    if (Main.mainWindow) {
      const link = new URL(target)

      if (link.protocol === 'app:') {
        if (process.env.WEBPACK_DEV_SERVER_URL) {
          // Load the url of the dev server if in development mode
          Main.mainWindow
            .loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)
            .then(() => Main.checkAuth)
            .catch(e => console.error(e))

          if (!process.env.IS_TEST)
            Main.mainWindow.webContents.openDevTools({ mode: 'detach' })
        } else {
          createProtocol('app')
          // Load the index.html when not in development
          Main.mainWindow
            .loadURL('app://./index.html')
            .then(() => Main.checkAuth)
            .catch(e => console.error(e))
        }
      } else {
        Main.mainWindow.loadURL(target).catch(e => console.error(e))
      }
    }
  }

  static start(
    app: Electron.App,
    ipcMain: Electron.IpcMain,
    browserWindow: typeof BrowserWindow,
    config: ElectronConfig = defaultConfig.electron,
    authFlow: AuthFlow = new AuthFlow()
  ) {
    // we pass the Electron.App object and the
    // Electron.BrowserWindow into this function
    // so this class has no dependencies. This
    // makes the code easier to write tests for

    Main.application = app
    Main.ipcMain = ipcMain
    Main.config = config

    Main.BrowserWindow = browserWindow
    Main.authFlow = authFlow

    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } }
    ])

    Main.application.removeAsDefaultProtocolClient('electron-test')
    Main.application.setAsDefaultProtocolClient('electron-test')

    Main.application.on('window-all-closed', Main.onWindowAllClosed)
    Main.application.on('ready', Main.onReady)
    Main.application.on('activate', Main.onActivate)

    // Security config
    // Intercept URL to load only whitelisted URL in the mainWindow
    Main.application.on(
      'web-contents-created',
      SecurityConfig.onWebContentsCreated
    )

    // Register our ipc
    IpcRegistry.register(ipcMain, authFlow)

    // Exit cleanly on request from parent process in development mode.
    if (isDevelopment) {
      if (process.platform === 'win32') {
        process.on('message', data => {
          if (data === 'graceful-exit') {
            app.quit()
          }
        })
      } else {
        process.on('SIGTERM', () => {
          app.quit()
        })
      }
    }
  }
}
