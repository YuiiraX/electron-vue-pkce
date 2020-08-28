import * as path from 'path'
import fs from 'fs'
import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'

import SecurityConfig from './security'
import defaultApplicationConfig, { ApplicationConfig } from './config'
import { IpcRegistry } from './ipc'

const isDevelopment = process.env.NODE_ENV !== 'production'

export default class Main {
  private static ipcMain: Electron.IpcMain
  private static mainWindow: Electron.BrowserWindow | null
  private static application: Electron.App
  private static BrowserWindow: typeof BrowserWindow
  private static config: ApplicationConfig

  private static createWindow() {
    const windowConfig = Main.config.window

    Main.mainWindow = new BrowserWindow({
      width: windowConfig.width,
      height: windowConfig.height,
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
      Main.mainWindow.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string)

      if (!process.env.IS_TEST)
        Main.mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
      createProtocol('app')
      // Load the index.html when not in development
      Main.mainWindow.loadURL('app://./index.html').catch(e => console.error(e))
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

  private static bootstrap() {
    protocol.registerSchemesAsPrivileged([
      { scheme: 'app', privileges: { secure: true, standard: true } }
    ])
  }

  static start(
    app: Electron.App,
    ipcMain: Electron.IpcMain,
    browserWindow: typeof BrowserWindow,
    config: ApplicationConfig = defaultApplicationConfig
  ) {
    // we pass the Electron.App object and the
    // Electron.BrowserWindow into this function
    // so this class has no dependencies. This
    // makes the code easier to write tests for

    Main.application = app
    Main.ipcMain = ipcMain
    Main.BrowserWindow = browserWindow
    Main.config = config

    Main.bootstrap()

    Main.application.removeAsDefaultProtocolClient('electron-test')
    Main.application.setAsDefaultProtocolClient('electron-test')

    Main.application.on('window-all-closed', Main.onWindowAllClosed)
    Main.application.on('ready', Main.onReady)
    Main.application.on(
      'web-contents-created',
      SecurityConfig.onWebContentsCreated
    )
    Main.application.on('activate', Main.onActivate)

    // Register our Ipc
    IpcRegistry.register(ipcMain)

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
