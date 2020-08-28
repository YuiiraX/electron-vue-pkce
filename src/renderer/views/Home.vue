<template>
  <div class="home">
    <LoginButton />
  </div>
</template>

<script>
// @ is an alias to /src
import LoginButton from '@/components/LoginButton.vue'

export default {
  name: 'Home',
  components: {
    LoginButton
  },
  methods: {
    callIpc() {
      window.ipcRenderer.send('auth-request')
    }
  }
}
</script>
