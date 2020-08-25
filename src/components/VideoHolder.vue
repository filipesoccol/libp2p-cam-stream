
<template>
    <div class="video-holder" v-if="blob">
        <div class="dots">
            <div v-for="(d, idx) in blobs" :key="idx" :class="{dot:true, disabled:idx>current}"></div>
        </div>
        <video
            ref="video"
            :src="blob"
            @ended="nextVideo()"
            autoplay
            playsinline
        >
        </video> 
    </div>
</template>

<script>

export default {
  name: "video-holder",
  props: {
    blobs: Array
  },
  data: function() {
    return {
      playing: false,
      blob: undefined,
      current: -1
    };
  },
  watch: {
    blobs(val) {
      if (!this.playing) {
        this.nextVideo();
        if (this.$refs.video.paused)
          this.$refs.video.play();
      }
      this.playing = true;
    }
  },
  methods: {
    nextVideo () {
      if (this.blobs.length === 0) return;
      this.current = (this.current+1)%this.blobs.length
      this.blob = this.blobs[this.current]
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
    background: white;
}
.dot.disabled {
  opacity: 0.3;
}
.custom-button {
  display: none !important;
}
video {
  width: 100%;
}
</style>