<template>
  <button @click="signIn">
    Login
  </button>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

@Component
export default class LoginButton extends Vue {
  signIn() {
    this.$store.dispatch('signIn').then(() => {
      this.$store.dispatch('getUserInfo')
    })
  }
}
</script>

<style scoped>

</style>
