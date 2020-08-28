import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

interface UserInfo {
  userId: string
  email: string
  name: string
}

interface rootState {
  userInfo: UserInfo,
  accessToken: string,
  refreshToken: string
}

export default new Vuex.Store({
  state: {
    userInfo: {
      userId: null,
      email: null,
      name: null
    },
    accessToken: null,
    refreshToken: null
  },
  mutations: {
    SET_USER_INFO: (state, payload) => {
      state.userInfo = payload
    },
    SET_ACCESS_TOKEN: (state, payload) => {
      state.accessToken = payload
    },
    SET_REFRESH_TOKEN: (state, payload) => {
      state.refreshToken = payload
    },
  },
  actions: {
    signIn: (context) => {
      return new Promise((resolve, reject) => {
        window.ipcRenderer.send('auth-request')
        window.ipcRenderer.once('auth-response', (event, args) => {
          if(!args.accessToken || !args.refreshToken) {
            reject(new Error('Authentication Failed'))
          }

          const { accessToken, refreshToken } = args

          context.commit('SET_ACCESS_TOKEN', accessToken)
          context.commit('SET_REFRESH_TOKEN', refreshToken)
          resolve()
        })
      })
    },
    getUserInfo: (context) => {

    }
  }
})
