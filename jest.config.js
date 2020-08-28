const path = require('path')

const vueSrc = 'src/renderer/$1'

module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  moduleNameMapper: {
    '^@/(.*)$': path.join(__dirname, vueSrc)
  }
}
