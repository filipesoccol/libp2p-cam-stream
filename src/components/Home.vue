<template>
  <div class="ipfs-info">
    <img class="ipfs-logo" alt="IPFS logo" src="../assets/logo.svg" />
    <div class="peer-id">
      {{ id }}
      <button v-if="!isRecording" @click="startRecord">Start Recording</button>
      <button v-if="isRecording" @click="stopRecord">Stop Recording</button>
    </div>
    
    <div class="videos-container">
      <video-holder v-for="(p,idx) in Object.keys(peers)" :key="idx" :blobs="peers[p].blobs"></video-holder>
    </div> 
  </div>
</template>

<script>
const pipe = require('it-pipe')
const PeerId = require('peer-id')

import VideoHolder from './VideoHolder.vue';

export default {
  name: "home",
  components: {
    videoHolder: VideoHolder
  },
  data: function() {
    return {
      id: "",
      peer: "",
      camera: undefined,
      recorder: undefined,
      isRecording: false,
      peers: [],
      interval: undefined,
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
        let peer = this.peers.find( p => p.id === msg.from);
        if (!peer) {
          peer = {
            id: msg.from,
            blobs: []
          }
          this.peers.push(peer);
        }
        peer.blobs.push(window.URL.createObjectURL( new Blob( [ msg.data ] ) ))
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
    async startRecord () {
      this.camera = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })

      if (!this.recorder)
        this.recorder = new MediaRecorder(this.camera);
      this.recorder.start(10000000000);
      // release camera on stopRecording
      // window.recorder.camera = camera;
      this.interval = setInterval( () => {
        this.restartRecording()
      }, 3000)
      // window.recorder.startRecording();
      this.isRecording = true;
      this.recorder.ondataavailable = async (e) => {
        if (this.isRecording)
          this.recorder.start(10000000000);
        this.sendMessage(await e.data.arrayBuffer());
      }
    },
    stopRecord () {
      this.isRecording = false;
      clearInterval(this.interval);
      this.recorder.stop();
      this.camera.getTracks().forEach(function(track) {
        track.stop();
      });
    },
    restartRecording () {
      this.recorder.stop();
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.ipfs-logo {
  position: absolute;
  top: 10px;
  left: 10px;
  height: 100px;
}
.peer-id {
  position: absolute;
  top: 10px;
  left: 110px;
  height: 100px;
  font-size: 12px;
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
.videos-container {
  position: absolute;
  top: 50px;
  left: 120px;
  right: 50px;
  /* background:gray; */
  display: flex;
  flex-flow: row wrap;
  flex-wrap: wrap;
  justify-content: space-evenly
}
.video-holder {
  position: relative;
  width: 320px;
  height: 240px;
  border-radius: 16px;
  margin: 4px;
  background: white;
  overflow:hidden;
  box-shadow: 0px 2px 10px gray;
}
.dots {
  position: absolute;
  width: 100%;
  padding-top: 8px;
  display: flex;
  flex-flow: row wrap;
  flex-wrap: wrap;
  background: transparent;
}
.dot {
    width: auto;
    flex-grow: 1;
    height: 8px;
    min-width: 8px;
    margin: 4px;
    border-radius: 4px;
    background: black;
}
.dot.disabled {
  opacity: 0.3;
}
.custom-button {
  display: none;
}
video {
  width: 100%;
}
</style>