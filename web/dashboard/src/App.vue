<template>
  <div id="app">
    <h2>Precios de Mercado</h2>
    <amplify-authenticator v-if="authState !== 'signedin'" />
    <div v-if="authState === 'signedin' && user">
      <b-card>
        <b-card-header>
          <h6>Bienvendio, {{ user.username }}</h6>
        </b-card-header>
        <b-card-body>
          <b-table show-empty small :striped="true" :fields="fields" :items="items"></b-table>
        </b-card-body>
        <b-card-footer>
          <div>
            <amplify-sign-out
                button-text="Salir"
                slot="sign-out">
            </amplify-sign-out>
          </div>
        </b-card-footer>
      </b-card>
    </div>
  </div>
</template>

<script>
import { onAuthUIStateChange } from '@aws-amplify/ui-components'
import {API} from "@aws-amplify/api"

export default {
  name: 'App',
  created() {
    onAuthUIStateChange((authState, authData) => {
      this.authState = authState;
      this.user = authData;
    });
    this.timer = setInterval(this.fetchData, 1000)
  },
  data() {
    return {
      timer: undefined,
      user: undefined,
      authState: undefined,
      signInFields: [
        {
          type: 'username',
          label: 'Nombre de Usuario',
          placeholder: 'Escriba su nombre de usuario',
          required: true
        },
        {
          type: 'password',
          label: 'Constraseña',
          placeholder: 'Escriba su contraseña',
          required: true
        }
      ],
      signUpFields: [
        {
          type: 'username',
          label: 'Nombre de Usuario',
          placeholder: 'Escriba su nombre de usuario',
          required: true
        },
        {
          type: 'password',
          label: 'Constraseña',
          placeholder: 'Escriba su contraseña',
          required: true
        },
        {
          type: 'email',
          label: 'Correo Electrónico',
          placeholder: 'Escriba su correo',
          required: true
        },
        {
          type: 'phone',
          label: 'Número Telefónico',
          placeholder: 'Escriba su teléfono',
          required: true
        }
      ],
      passwordFields: [
        {
          type: 'username',
          label: 'Nombre de Usuario',
          placeholder: 'Escriba su nombre de usuario',
          required: true
        }
      ],
      fields: [
        {key: 'instrument', label: 'Instrumeto', sortable: true, sortDirection: 'desc'},
        {key: 'price_1', label: 'Precio 1'},
        {key: 'price_2', label: 'Precio 2'},
        {key: 'price_3', label: 'Precio 3'},
        {key: 'price_4', label: 'Precio 4'},
        {key: 'price_5', label: 'Precio 5'},
        {key: 'price_6', label: 'Precio 6'},
        {key: 'price_7', label: 'Precio 7'},
        {key: 'price_8', label: 'Precio 8'}
      ],
      items: [
        {instrument: 1, price_1: 23.1, price_2: 23.1, price_3: 23.1, price_4: 23.1, price_5: 23.1, price_6: 23.1,
          price_7: 23.1, price_8: 23.1},
        {instrument: 2, price_1: 23.1, price_2: 23.1, price_3: 23.1, price_4: 23.1, price_5: 23.1, price_6: 23.1,
          price_7: 23.1, price_8: 23.1}
      ]
    }
  },
  beforeDestroy() {
    return onAuthUIStateChange;
  },
  methods: {
    fetchData() {
      if (this.authState === 'signedin') {
        API.get('AnalyticsAPI', '/data').then( outcome => {
          this.items = outcome
        }).catch(error => {
          console.log(error)
        })
      }
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
