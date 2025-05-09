// 组件 - ChapterList.vue
<template>
  <div class="chapter-list">
    <div class="list-header">
      <h3 class="list-title">目录</h3>
      <span class="chapter-count">{{ chapters.length }}章</span>
    </div>
    <van-list>
      <div 
        v-for="chapter in chapters" 
        :key="chapter.id" 
        class="chapter-item"
        @click="navigateToChapter(chapter.id)"
      >
        <div class="chapter-info">
          <div class="chapter-number">{{ chapter.id }}</div>
          <h4 class="chapter-title">{{ chapter.title }}</h4>
        </div>
        <van-icon name="arrow" class="chapter-arrow" />
      </div>
    </van-list>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps({
  chapters: {
    type: Array,
    required: true
  }
});

const router = useRouter();

const navigateToChapter = (chapterId) => {
  router.push(`/detail/${chapterId}`);
};
</script>

<style scoped>
.chapter-list {
  background-color: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px var(--shadow-color);
  border: 1px solid var(--border-color);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color);
}

.list-title {
  color: var(--header-color);
  font-size: 15px;
  margin: 0;
  position: relative;
  padding-left: 10px;
}

.list-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 14px;
  background-color: var(--primary-color);
  border-radius: 1.5px;
}

.chapter-count {
  font-size: 11px;
  color: #777;
  background-color: var(--tag-bg);
  padding: 1px 6px;
  border-radius: 8px;
}

.chapter-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 7px 5px;
  border-bottom: 1px solid rgba(217, 199, 167, 0.2);
  cursor: pointer;
  transition: all 0.2s;
}

.chapter-item:last-child {
  border-bottom: none;
}

.chapter-item:active {
  background-color: var(--chapter-hover);
}

.chapter-info {
  display: flex;
  align-items: center;
  flex: 1;
  overflow: hidden;
}

.chapter-number {
  min-width: 20px;
  height: 20px;
  background-color: var(--accent-color);
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  margin-right: 8px;
  flex-shrink: 0;
  padding: 0 5px;
}

.chapter-title {
  font-size: 13px;
  color: var(--text-color);
  margin: 0;
  transition: color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: normal;
}

.chapter-item:active .chapter-title {
  color: var(--primary-color);
}

.chapter-arrow {
  color: #ccc;
  font-size: 13px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.chapter-item:active .chapter-arrow {
  color: var(--accent-color);
  transform: translateX(2px);
}
</style>