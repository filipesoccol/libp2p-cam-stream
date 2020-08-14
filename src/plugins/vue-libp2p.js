const Libp2p = require('libp2p')
const Websockets = require('libp2p-websockets')
const WebRTC = require('libp2p-webrtc-star')
const Mplex = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const Gossipsub = require('libp2p-gossipsub')
const Bootstrap = require('libp2p-bootstrap')
// const pipe = require('it-pipe')

const plugin = {
  install(Vue, opts = {}) {

    Vue.prototype.$startLibp2p = async function () {
      const node = await Libp2p.create({
        addresses: {
          listen: [
            '/dns4/wrtc-star1.par.dwebops.pub/tcp/443/wss/p2p-webrtc-star',
            '/dns4/wrtc-star2.sjc.dwebops.pub/tcp/443/wss/p2p-webrtc-star'
          ]
        },
        modules: {
          transport: [Websockets, WebRTC],
          streamMuxer: [Mplex],
          connEncryption: [SECIO],
          pubsub: Gossipsub
        },
        config: {
          pubsub: {
            enabled: true,
            emitSelf: true
          }
        }
      })

      // Listen for new peers
      node.on('peer:discovery', (peerId) => {
        console.log(`Found peer ${peerId.toB58String()}`)
      })

      // Listen for new connections to peers
      node.connectionManager.on('peer:connect', (connection) => {
        // console.log(`Connected to ${connection.remotePeer.toB58String()}`)
        console.log(`Connected to ${connection.remotePeer}`)
      })

      // Listen for peers disconnecting
      node.connectionManager.on('peer:disconnect', (connection) => {
        console.log(`Disconnected from ${connection.remotePeer.toB58String()}`)
      })
    
      await node.start()
      return node

    }
  }
}

export default plugin
