import Amplify from 'aws-amplify'
import '@aws-amplify/ui-vue'
import Vue from 'vue'
import App from './App.vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

// Configure Amplify
Amplify.configure({
  Auth: {
    identityPoolId: 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX',
    identityPoolRegion: 'us-east-1',
    userPoolId: 'us-east-X_XXXXXXXXX',
    userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
    region: 'us-east-1'
  },
  API: {
    endpoints: [
      {
        name: 'AnalyticsAPI',
        endpoint: 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/prod'
      }
    ]
  }
})

Vue.config.productionTip = false
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)

new Vue({
  render: h => h(App),
}).$mount('#app')
