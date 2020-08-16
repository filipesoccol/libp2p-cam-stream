<template>
  <div class="ipfs-info">
    <img class="ipfs-logo" alt="IPFS logo" src="../assets/logo.svg" />
    <!-- <video ref="video" controls autoplay playsinline></video> -->
    <video ref="video" :src="blob" controls autoplay playsinline></video>
    <button v-if="!isRecording" @click="startRecord">Start Recording</button>
    <button v-if="isRecording" @click="stopRecord">Stop Recording</button>
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
      peer: "",
      isRecording: false,
      camera: {},
      recorder: {},
      blob: {},
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
      this.libp2p.pubsub.subscribe('hiveriot', async (msg) => {
        // console.log(blob);
        this.blob = window.URL.createObjectURL( new Blob( [ msg.data ] ) );
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
    sendMessage (m) {
      if (this.peer) {
        console.log('enviando... ', this.peer)
        this.sendDirectMessage(this.peer)
      } else {
        this.libp2p.pubsub.publish('hiveriot', m)
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
    },
    async startRecord () {
      const camera = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      // this.$refs.video.srcObject = camera;
      // this.$refs.video.muted = true;
      // this.$refs.video.volume = 0;
      // this.$refs.video.play();

      window.recorder = new RecordRTC(camera, {
          type: 'video',
      });
      // release camera on stopRecording
      window.recorder.camera = camera;
      setInterval( () => {
        this.restartRecording();
      }, 8000)
      window.recorder.startRecording();
      this.isRecording = true;
    },
    stopRecord () {
      this.isRecording = false;
      window.recorder.camera.stop();
      window.recorder.destroy();
      window.recorder = null;
    },
    restartRecording () {
      window.recorder.stopRecording( async (blob) => {
        const b = window.recorder.getBlob();
        console.log(b);
        this.sendMessage(await b.arrayBuffer());
        window.recorder.startRecording();
      })
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