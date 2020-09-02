<template>
  <div class="home">
    <button @click.prevent="signIn">Login</button>
    <button @click.prevent="callApi">Call Api</button>
    <div>
      <span>
        {{ userInfo }}
      </span>
    </div>
    <div>
      <span>
        {{ apiResponse }}
      </span>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { mapState } from 'vuex'

export default {
  name: 'Home',
  computed: {
    ...mapState(['userInfo', 'apiResponse'])
  },
  methods: {
    signIn() {
      this.$store.dispatch('signIn').then(() => {
        this.$store.dispatch('getUserInfo')
      })
    },
    callApi() {
      this.$store.dispatch('callApi')
    }
  }
}
</script>
