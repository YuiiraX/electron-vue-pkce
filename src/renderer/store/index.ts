import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    userInfo: null,
    accessToken: null,
    apiResponse: null
  },
  mutations: {
    SET_USER_INFO: (state, payload) => {
      state.userInfo = payload
    },
    SET_ACCESS_TOKEN: (state, payload) => {
      state.accessToken = payload
    },
    SET_API_RESPONSE: (state, payload) => {
      state.apiResponse = payload
    }
  },
  actions: {
    signIn: () => {
      window.ipcRenderer.send('auth-request')
    },
    signOut: ({ commit }) => {
      return new Promise((resolve, reject) => {
        console.log('checking for saved user')
        window.ipcRenderer.send('sign-out-request')
        window.ipcRenderer.once('sign-out-response', (event, args) => {
          console.log(args)
          if (!args.status || args.status !== 'ok') {
            reject()
          }

          commit('SET_ACCESS_TOKEN', null)
          commit('SET_USER_INFO', null)
          resolve()
        })
      })
    },
    callApi: ({ state, commit }) => {
      return new Promise((resolve, reject) => {
        // You can use axios to call the apis as well
        const apiEndpoint =
          process.env.APP_API_ENDPOINT ||
          'https://demo.identityserver.io/api/test'
        const request = new Request(apiEndpoint, {
          headers: new Headers({
            Authorization: `Bearer ${state.accessToken}`
          }),
          method: 'GET',
          cache: 'no-cache'
        })
        fetch(request)
          .then(result => result.json())
          .then(response => {
            console.log('User Info ', response)
            commit('SET_API_RESPONSE', response)
            resolve()
          })
          .catch(error => {
            reject(error)
          })
      })
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
    getUserInfo: ({ state, commit }) => {
      return new Promise((resolve, reject) => {
        if (state.accessToken) {
          const request = new Request(
            (process.env.APP_OAUTH_USER_ENDPOINT as string) ||
              'https://demo.identityserver.io/connect/userinfo',
            {
              headers: new Headers({
                Authorization: `Bearer ${state.accessToken}`
              }),
              method: 'GET',
              cache: 'no-cache'
            }
          )
          fetch(request)
            .then(result => result.json())
            .then(user => {
              console.log('User Info ', user)
              commit('SET_USER_INFO', user)
              resolve()
            })
            .catch(error => {
              reject(error)
            })
        } else {
          reject('Please sign in to get user info')
        }
      })
    }
  }
})
