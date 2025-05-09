<template>
    <div class="video-player">
      <div class="video-title">{{ title }}</div>
      <div class="video-container" :class="{ 'fullscreen': isFullscreen }">
        <video 
          ref="videoRef" 
          :src="src" 
          :poster="poster" 
          @click="togglePlay"
          @timeupdate="onTimeUpdate"
        ></video>
        <div class="video-controls" v-show="showControls">
          <button @click="togglePlay" class="control-btn">
            {{ isPlaying ? '暂停' : '播放' }}
          </button>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <button @click="toggleFullscreen" class="control-btn">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, defineProps, onMounted, onUnmounted } from 'vue';
  
  const props = defineProps({
    src: {
      type: String,
      required: true
    },
    poster: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: '视频'
    }
  });
  
  const videoRef = ref(null);
  const isPlaying = ref(false);
  const isFullscreen = ref(false);
  const showControls = ref(false);
  const progress = ref(0);
  let controlsTimeout;
  
  const togglePlay = () => {
    if (videoRef.value) {
      if (isPlaying.value) {
        videoRef.value.pause();
        isPlaying.value = false;
      } else {
        videoRef.value.play();
        isPlaying.value = true;
      }
      showControlsTemporarily();
    }
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.value.requestFullscreen().then(() => {
        isFullscreen.value = true;
      });
    } else {
      document.exitFullscreen().then(() => {
        isFullscreen.value = false;
      });
    }
    showControlsTemporarily();
  };
  
  const onTimeUpdate = () => {
    if (videoRef.value) {
      const currentTime = videoRef.value.currentTime;
      const duration = videoRef.value.duration;
      progress.value = (currentTime / duration) * 100;
    }
  };
  
  const showControlsTemporarily = () => {
    showControls.value = true;
    clearTimeout(controlsTimeout);
    controlsTimeout = setTimeout(() => {
      if (isPlaying.value) {
        showControls.value = false;
      }
    }, 3000);
  };
  
  onMounted(() => {
    videoRef.value.addEventListener('mousemove', showControlsTemporarily);
  });
  
  onUnmounted(() => {
    if (videoRef.value) {
      videoRef.value.removeEventListener('mousemove', showControlsTemporarily);
    }
    clearTimeout(controlsTimeout);
  });
  </script>
  
  <style scoped>
  .video-player {
    margin: 16px 0;
  }
  
  .video-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--accent-color);
  }
  
  .video-container {
    position: relative;
    width: 100%;
    background-color: #000;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .video-container video {
    width: 100%;
    display: block;
  }
  
  .video-container.fullscreen {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
  }
  
  .video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background-color: rgba(0, 0, 0, 0.5);
    padding: 8px;
    display: flex;
    align-items: center;
  }
  
  .control-btn {
    background-color: var(--primary-color);
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .progress-bar {
    flex: 1;
    height: 4px;
    background-color: rgba(255, 255, 255, 0.3);
    margin: 0 8px;
    border-radius: 2px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background-color: var(--primary-color);
  }
  </style>
  