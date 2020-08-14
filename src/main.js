import Vue from 'vue';
import App from './App.vue';
import VueLibp2p from './plugins/vue-libp2p';

// Load our IPFS plugin.
Vue.use(VueLibp2p);

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
