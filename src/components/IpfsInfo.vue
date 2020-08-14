<template>
  <div class="ipfs-info">
    <img class="ipfs-logo" alt="IPFS logo" src="../assets/logo.svg" />
    <form v-on:submit.prevent="sendMessage">
      <div id="messages" class="messages">
        <p v-for="(m,idx) in messages" :key="idx">{{ m }}</p>
      </div>
      <input size="50" v-model="message" placeholder="Write something and press enter."/><br>
      <input size="50" v-model="peer" placeholder="Fill target Peer for direct message."/>
      <input type="submit">
    </form>
    <h4>{{ status }}</h4>
    <h5>ID: {{ id }}</h5>
  </div>
</template>

<script>
const pipe = require('it-pipe')
const PeerId = require('peer-id')

export default {
  name: "IpfsInfo",
  data: function() {
    return {
      status: "Connecting to IPFS...",
      id: "",
      message: "",
      peer: "",
      messages: [],
      libp2p: {}
    };
  },
  mounted: function() {
    this.startPubsub();
  },
  methods: {
    async startPubsub() {
      this.libp2p = await this.$startLibp2p();
      window.libp2p = this.libp2p
      this.id = this.libp2p.peerId.toB58String();
      this.libp2p.pubsub.subscribe('news', (msg) => {
        // console.log(`node1 received: ${msg.data.toString()}`)
        this.messages.push(msg.data.toString());
        var elem = document.getElementById('messages');
        elem.scrollTop = elem.scrollHeight;
      })
      this.libp2p.handle('/protocool', ({ stream }) => {
        pipe(
          stream,
          async (source) => {
            for await (const msg of source) {
              this.messages.push(msg.toString())
            }
          }
        )
      })
    },
    sendMessage () {
      if (this.peer) {
        console.log('enviando... ', this.peer)
        this.sendDirectMessage(this.peer)
      } else {
        this.libp2p.pubsub.publish('news', this.message)
        this.message = ''
      }
    },
    async sendDirectMessage (target) {
      console.log(this.libp2p.peerStore.peers.get(target));
      let peer = this.libp2p.peerStore.peers.get(target);
      const { stream } = await this.libp2p.dialProtocol(peer.id, '/protocool')
      await pipe(
        [this.message],
        stream
      )
    }

  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ipfs-logo {
  height: 10rem;
}
.messages {
  display: flex;
  flex-direction: column;
  flex-flow: column;
  align-items: center;
  overflow-y: scroll;
  max-height: 300px;
}
.messages p {
  max-width: 300px;
}

</style>