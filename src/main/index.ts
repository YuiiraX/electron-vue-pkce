'use strict'

import { app, BrowserWindow, ipcMain } from 'electron'
import Main from './main'

// fix
if (process.env.NODE_ENV !== 'production') {
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
}

Main.start(app, ipcMain, BrowserWindow)
