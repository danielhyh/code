// App.vue
<template>
  <div class="app-container">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
// App component setup logic
</script>

<style>
:root {
  /* 陕西文化色彩 */
  --primary-color: #8D1D21; /* 秦砖汉瓦的红色 */
  --secondary-color: #F2CD88; /* 古城墙黄色 */
  --accent-color: #25476A; /* 山水画中的蓝色 */
  --background-color: #F8F5F0; /* 宣纸底色 */
  --text-color: #333333;
  --border-color: #D9C7A7; /* 传统家具木色 */
  --header-color: #5A3D2B; /* 古建筑木色 */
  --shadow-color: rgba(0, 0, 0, 0.1);
  --tag-bg: #f4e9da;
  --author-badge-bg: #f7e2d3;
  --category-badge-bg: #e0ece9;
  --chapter-hover: #f9f3ea;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

body {
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.5;
  font-size: 14px;
}

.app-container {
  min-height: 100vh;
  position: relative;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 使滚动更平滑 */
html {
  scroll-behavior: smooth;
}

/* 移除滚动条但保留功能 */
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

/* 添加一些通用的工具类 */
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.text-center {
  text-align: center;
}

.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>