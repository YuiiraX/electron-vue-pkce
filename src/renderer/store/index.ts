import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    userInfo: null,
    accessToken: null
  },
  mutations: {
    SET_USER_INFO: (state, payload) => {
      state.userInfo = payload
    },
    SET_ACCESS_TOKEN: (state, payload) => {
      state.accessToken = payload
    }
  },
  actions: {
    signIn: () => {
      window.ipcRenderer.send('auth-request')
    },
    requestNewToken: context => {
      return new Promise((resolve, reject) => {
        console.log('checking for saved user')
        window.ipcRenderer.send('new-token-request')
        window.ipcRenderer.once('new-token-response', (event, args) => {
          console.log(args)
          if (!args.accessToken) {
            reject('No user found, please perform auth request again')
          }

          const { accessToken } = args

          context.commit('SET_ACCESS_TOKEN', accessToken)
          resolve()
        })
      })
    },
    getUserInfo: context => {
      return new Promise((resolve, reject) => {
        const request = new Request(
          'https://demo.identityserver.io/connect/userinfo',
          {
            headers: new Headers({
              Authorization: `Bearer ${context.state.accessToken}`
            }),
            method: 'GET',
            cache: 'no-cache'
          }
        )

        fetch(request)
          .then(result => result.json())
          .then(user => {
            console.log('User Info ', user)
            context.commit('SET_USER_INFO', user)
            resolve()
          })
          .catch(error => {
            reject(error)
          })
      })
    }
  }
})
