'use strict'
import { app, BrowserWindow, ipcMain } from 'electron'
import Main from './main'

Main.start(app, ipcMain, BrowserWindow)
