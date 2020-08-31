// If your port is set to 80,
// use administrator privileges to execute the command line.
// For example, on Mac: sudo npm run / sudo yarn
const path = require('path')

const devServerPort = process.env.DEV_PORT || 8080
const name = process.env.VUE_APP_NAME || 'Electron Vue PKCE Auth Sample'
const vueSrc = './src/renderer'

module.exports = {
  devServer: {
    port: devServerPort,
    overlay: {
      warning: false,
      errors: true
    },
    progress: false
  },
  pages: {
    index: {
      entry: 'src/renderer/main.ts',
      title: name
    }
  },
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.join(__dirname, vueSrc)
      }
    }
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        productName: 'ElectronVuePKCEAuthSample',
        win: {
          target: 'zip',
          icon: './app.ico'
        }
      },
      mainProcessFile: 'src/main/index.ts',
      preload: 'src/renderer/preload.ts'
    }
  }
}
