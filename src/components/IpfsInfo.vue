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
      message: "",
      peer: "",
      isRecording: false,
      camera: {},
      recorder: {},
      blob: {},
      messages: [],
      libp2p: {}
    };
  },
  mounted: function() {
    //this.startPubsub();
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
    },
    async startRecord () {
      const camera = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      // this.$refs.video.srcObject = camera;
      // this.$refs.video.muted = true;
      // this.$refs.video.volume = 0;
      // this.$refs.video.play();

      window.recorder = new RecordRTC(camera, {
          type: 'video',
          // get intervals based blobs
          // timeSlice: 5000,
          // returns blob via callback function
          // ondataavailable: (blob) => {
          //   if (this.isRecording){
          //       this.chunks.push(blob);
          //       window.URL.createObjectURL(blob)
          //         // this.cameraBlob = window.URL.createObjectURL(blob);
          //         //this.$refs.video2.src = window.URL.createObjectURL(blob);
          //         //this.cameraBlob.addTrack(event.track, window.URL.createObjectURL(blob));
          //   }
          // }
      });

      setInterval(this.restartRecording, 10000);
      // release camera on stopRecording
      window.recorder.camera = camera;
      window.recorder.startRecording();
      this.isRecording = true;
    },
    stopRecord () {
      this.isRecording = false;
      // this.$refs.video.muted = false;
      // this.$refs.video.volume = 1;
      // this.$refs.video.src = null;
      // this.$refs.video.srcObject = window.recorder.getBlob();
      
      window.recorder.camera.stop();
      window.recorder.destroy();
      window.recorder = null;
    },
    restartRecording () {
      window.recorder.stopRecording( () => {
        const b = window.recorder.getBlob();
        this.blob = window.URL.createObjectURL(b);
      })
      window.recorder.startRecording();
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