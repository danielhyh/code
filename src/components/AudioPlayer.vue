<template>
    <div class="audio-player">
      <div class="audio-title">{{ title }}</div>
      <div class="audio-controls">
        <van-button 
          :type="isPlaying ? 'danger' : 'primary'" 
          size="small" 
          @click="togglePlay"
        >
          {{ isPlaying ? '暂停' : '播放' }}
        </van-button>
        <div class="audio-progress">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <div class="progress-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
        </div>
      </div>
      <audio 
        ref="audioRef" 
        :src="src" 
        @timeupdate="onTimeUpdate" 
        @loadedmetadata="onLoadedMetadata"
      ></audio>
    </div>
  </template>
  
  <script setup>
  import { ref, defineProps, watch, onMounted, onUnmounted } from 'vue';
  import { useBookStore } from '../stores/bookStore';
  
  const props = defineProps({
    src: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: '音频'
    }
  });
  
  const audioRef = ref(null);
  const isPlaying = ref(false);
  const progress = ref(0);
  const currentTime = ref(0);
  const duration = ref(0);
  
  const bookStore = useBookStore();
  
  // 监听全局的音频状态变化
  watch(() => bookStore.isPlayingAudio, (newValue) => {
    if (newValue && bookStore.currentAudioSrc === props.src) {
      playAudio();
    } else {
      pauseAudio();
    }
  });
  
  const togglePlay = () => {
    bookStore.toggleAudio(props.src);
  };
  
  const playAudio = () => {
    if (audioRef.value) {
      audioRef.value.play();
      isPlaying.value = true;
    }
  };
  
  const pauseAudio = () => {
    if (audioRef.value) {
      audioRef.value.pause();
      isPlaying.value = false;
    }
  };
  
  const onTimeUpdate = () => {
    if (audioRef.value) {
      currentTime.value = audioRef.value.currentTime;
      progress.value = (currentTime.value / duration.value) * 100;
    }
  };
  
  const onLoadedMetadata = () => {
    if (audioRef.value) {
      duration.value = audioRef.value.duration;
    }
  };
  
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // 组件卸载时停止播放
  onUnmounted(() => {
    pauseAudio();
    if (bookStore.currentAudioSrc === props.src) {
      bookStore.stopAudio();
    }
  });
  </script>
  
  <style scoped>
  .audio-player {
    background-color: white;
    border-radius: 8px;
    padding: 12px;
    margin: 16px 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border: 1px solid var(--border-color);
  }
  
  .audio-title {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 8px;
    color: var(--accent-color);
  }
  
  .audio-controls {
    display: flex;
    align-items: center;
  }
  
  .audio-progress {
    flex: 1;
    margin-left: 16px;
  }
  
  .progress-bar {
    height: 6px;
    background-color: #eee;
    border-radius: 3px;
    overflow: hidden;
    margin-bottom: 4px;
  }
  
  .progress-fill {
    height: 100%;
    background-color: var(--primary-color);
  }
  
  .progress-time {
    font-size: 12px;
    color: #999;
    text-align: right;
  }
  </style>