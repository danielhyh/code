// 组件 - BookCover.vue
<template>
  <div class="book-cover">
    <div class="cover-container">
      <div class="cover-wrapper">
        <div class="cover-overlay"></div>
        <img :src="cover" :alt="title" class="cover-image" />
        <div class="cover-shadow"></div>
        <div class="cover-shine"></div>
      </div>
      <div class="book-info">
        <h2 class="book-title">{{ title }}</h2>
        
        <div class="book-meta">
          <div class="meta-badge author-badge">
            <van-icon name="manager-o" />
            <span>{{ author }}</span>
          </div>
          
          <div class="meta-badge category-badge">
            <van-icon name="label-o" />
            <span>{{ category }}</span>
          </div>
          
          <div class="meta-item date-item">
            <van-icon name="clock-o" class="date-icon"/>
            <span class="date-text">{{ publishDate }}</span>
          </div>
        </div>
        
        <div v-if="description" class="book-description">
          <div class="description-icon">
            <van-icon name="description" />
          </div>
          <p>{{ truncatedDescription }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  cover: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  publishDate: {
    type: String,
    default: ''
  }
});

const truncatedDescription = computed(() => {
  if (props.description && props.description.length > 60) {
    return props.description.substring(0, 60) + '...';
  }
  return props.description;
});
</script>

<style scoped>
.book-cover {
  margin-bottom: 12px;
}

.cover-container {
  display: flex;
  background-color: white;
  border-radius: 12px;
  padding: 14px 12px;
  box-shadow: 0 3px 15px rgba(0,0,0,0.07);
  border: 1px solid var(--border-color);
  position: relative;
  overflow: hidden;
}

.cover-container::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 120px;
  height: 120px;
  background: radial-gradient(circle at top right, rgba(217, 199, 167, 0.15), transparent 70%);
  z-index: 1;
}

.cover-wrapper {
  width: 85px;
  height: 130px;
  margin-right: 14px;
  flex-shrink: 0;
  border-radius: 5px;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  position: relative;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(110deg, 
    rgba(255,255,255,0.1) 0%, 
    rgba(255,255,255,0) 20%, 
    rgba(0,0,0,0.1) 100%);
  z-index: 3;
  pointer-events: none;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.5s ease;
  z-index: 2;
  position: relative;
}

.cover-container:hover .cover-image {
  transform: scale(1.03);
}

.cover-shadow {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 95%;
  height: 95%;
  background-color: rgba(0,0,0,0.15);
  border-radius: 5px;
  z-index: 1;
  filter: blur(3px);
}

.cover-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.4) 0%,
    rgba(255, 255, 255, 0) 60%
  );
  z-index: 4;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

.cover-container:hover .cover-shine {
  opacity: 1;
}

.book-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 2;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--primary-color);
  margin: 0 0 10px 0;
  line-height: 1.3;
  position: relative;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-title::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 40px;
  height: 2px;
  background: linear-gradient(to right, var(--primary-color), transparent);
  border-radius: 1px;
}

.book-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 8px;
  margin-bottom: 6px;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 12px;
  font-size: 11px;
  line-height: 1.2;
  position: relative;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.meta-badge .van-icon {
  font-size: 12px;
  margin-right: 4px;
}

.author-badge {
  background-color: var(--author-badge-bg);
  color: #a85d53;
  border-left: 2px solid #a85d53;
}

.category-badge {
  background-color: var(--category-badge-bg);
  color: #2d6a62;
  border-left: 2px solid #2d6a62;
}

.meta-item {
  display: flex;
  align-items: center;
  font-size: 11px;
  margin-top: 2px;
}

.date-item {
  color: #777;
  display: flex;
  align-items: center;
  font-style: italic;
  margin-top: 4px;
}

.date-icon {
  font-size: 12px;
  margin-right: 4px;
  color: var(--accent-color);
}

.date-text {
  position: relative;
}

.date-text::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  width: 100%;
  height: 1px;
  background-color: rgba(119, 119, 119, 0.3);
}

.book-description {
  margin-top: 8px;
  position: relative;
  background-color: rgba(248, 245, 240, 0.7);
  padding: 8px 10px;
  padding-left: 28px;
  border-radius: 5px;
  font-size: 12px;
  color: #555;
  line-height: 1.4;
  border-left: 2px solid var(--secondary-color);
}

.description-icon {
  position: absolute;
  left: 8px;
  top: 8px;
  color: var(--secondary-color);
  opacity: 0.8;
}

.book-description p {
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>