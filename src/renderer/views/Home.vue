<template>
  <div class="home">
    <LoginButton />
    <span>
      {{ userInfo }}
    </span>
  </div>
</template>

<script>
// @ is an alias to /src
import LoginButton from '@/components/LoginButton.vue'

export default {
  name: 'Home',
  computed: {
    userInfo() {
      return this.$store.state.userInfo
    }
  },
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
