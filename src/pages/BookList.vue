<template>
  <div class="page-container">
    <!-- 顶部导航栏 -->
    <div class="app-header">
      <h1 class="page-title">带您阅智享阅读器</h1>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="isLoading" class="loading-container">
      <van-loading type="spinner" color="#8D1D21" />
      <p class="loading-text">加载书籍信息...</p>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="hasError" class="error-container">
      <van-icon name="warning-o" size="48" color="#8D1D21" />
      <p class="error-text">{{ error }}</p>
      <button class="retry-button" @click="initData">重试</button>
    </div>
    
    <!-- 书籍内容 -->
    <template v-else-if="book">
      <book-cover 
        :title="book.title || '未知书名'"
        :author="book.author || '未知作者'"
        :category="book.category || '其他'"
        :cover="book.cover || ''"
        :publishDate="book.publishDate || ''"
        :description="book.description || '暂无描述'"
      />
      
      <div class="chapter-list">
        <div class="list-header">
          <h3 class="list-title">目录</h3>
          <span class="chapter-count">{{ book.chapters?.length || 0 }}章</span>
        </div>
        
        <div class="chapters-container">
          <template v-if="book.chapters && book.chapters.length > 0">
            <div 
              v-for="chapter in book.chapters" 
              :key="chapter.id" 
              class="chapter-item"
              @click="navigateToChapter(chapter.id)"
            >
              <div class="chapter-info">
                <!-- <div class="chapter-number">{{ chapter.id }}</div> -->
                <h4 class="chapter-title">{{ chapter.title }}</h4>
              </div>
              <van-icon name="arrow" class="chapter-arrow" />
            </div>
          </template>
          <div v-else class="empty-chapters">
            <van-empty description="暂无章节内容" />
          </div>
        </div>
      </div>
    </template>
    
    <!-- 空状态 -->
    <div v-else class="empty-container">
      <van-empty description="暂无书籍信息" />
    </div>

    <!-- 错误提示 Toast -->
    <van-toast id="api-error-toast" />
  </div>
</template>

<script setup>
import { onMounted, ref, onBeforeMount, computed, onUnmounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { useBookStore } from '../stores/bookStore';
import { showToast } from 'vant';
import BookCover from '../components/BookCover.vue';

const router = useRouter();
const bookStore = useBookStore();
const { book, loading, error } = storeToRefs(bookStore);
const windowHeight = ref(0);

// 本地加载状态，用于处理API加载时间较长的情况
const localLoading = ref(false);
let loadingTimer = null;

// 计算属性
const isLoading = computed(() => loading.value || localLoading.value);
const hasError = computed(() => !!error.value);

// 初始化数据
const initData = async () => {
  try {
    localLoading.value = true;
    
    // 设置一个超时，如果20秒后仍未加载完成，显示超时提示
    loadingTimer = setTimeout(() => {
      if (localLoading.value) {
        showToast({
          message: '加载时间较长，请耐心等待...',
          duration: 3000
        });
      }
    }, 20000);
    
    await bookStore.initBookData();
    
    // 检查书籍和章节数据
    if (!book.value) {
      throw new Error('无法获取书籍数据');
    }
    
    if (!book.value.chapters || book.value.chapters.length === 0) {
      showToast({
        message: '该书籍暂无章节内容',
        duration: 3000
      });
    }
  } catch (err) {
    console.error('加载书籍数据失败:', err);
    showToast({
      message: `加载书籍数据失败: ${err.message || '未知错误'}`,
      type: 'fail',
      duration: 3000
    });
  } finally {
    clearTimeout(loadingTimer);
    localLoading.value = false;
    
    // 延迟执行高度调整，确保DOM已完全渲染
    setTimeout(adjustChaptersContainerHeight, 300);
  }
};

// 计算窗口高度
const updateWindowHeight = () => {
  windowHeight.value = window.innerHeight;
  adjustChaptersContainerHeight();
};

// 调整章节容器高度
const adjustChaptersContainerHeight = () => {
  const chaptersContainer = document.querySelector('.chapters-container');
  if (chaptersContainer) {
    // 计算其他元素的高度总和
    const pageContainer = document.querySelector('.page-container');
    const header = document.querySelector('.app-header');
    const bookCover = document.querySelector('.book-cover');
    const listHeader = document.querySelector('.list-header');
    
    if (pageContainer && header && bookCover && listHeader) {
      const otherElementsHeight = 
        header.offsetHeight + 
        bookCover.offsetHeight + 
        listHeader.offsetHeight + 
        40; // 额外边距和padding
      
      // 计算章节容器应该的高度
      const availableHeight = windowHeight.value - otherElementsHeight;
      chaptersContainer.style.maxHeight = `${Math.max(availableHeight, 200)}px`;
    }
  }
};

// 导航到章节页面
// const navigateToChapter = (chapterId) => {
//   if (!chapterId) {
//     showToast({
//       message: '无效的章节ID',
//       type: 'fail'
//     });
//     return;
//   }
  
//   // 显示加载提示
//   showToast({
//     message: '正在加载章节...',
//     duration: 800
//   });
  
//   // 导航到章节详情页
//   setTimeout(() => {
//     router.push(`/detail/${chapterId}`);
//   }, 300);
// };

const navigateToChapter = (chapterId) => {
  if (!chapterId) {
    showToast({
      message: '无效的章节ID',
      type: 'fail'
    });
    return;
  }
  
  console.log(`导航到章节，chapterId: ${chapterId}`);
  
  // 显示加载提示
  showToast({
    message: '正在加载章节...',
    duration: 800
  });
  
  // 从 store 获取当前的 uniqueCodeId
  const uniqueCodeId = bookStore.uniqueCodeId;
  console.log(`当前的 uniqueCodeId: ${uniqueCodeId}`);
  
  // 导航到章节详情页，将 uniqueCodeId 作为查询参数传递
  setTimeout(() => {
    router.push({
      path: `/detail/${chapterId}`
      // query: { uniqueCodeId }
    });
  }, 300);
};
  


onBeforeMount(() => {
  updateWindowHeight();
  window.addEventListener('resize', updateWindowHeight);
});

onMounted(() => {
  // 进入列表页时清除当前章节
  bookStore.setCurrentChapter(null);
  
  // 初始化书籍数据
  initData();
});

onUnmounted(() => {
  // 清理
  window.removeEventListener('resize', updateWindowHeight);
  clearTimeout(loadingTimer);
});
</script>

<style scoped>
.page-container {
  padding: 10px;
  min-height: 100vh;
  max-width: 750px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: relative;
  text-align: center;
  margin-bottom: 15px;
}

.page-title {
  color: var(--primary-color, #8D1D21);
  font-size: 18px;
  font-weight: bold;
  margin: 0;
  padding-bottom: 8px;
  position: relative;
  letter-spacing: 1px;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: var(--primary-color, #8D1D21);
}

.chapter-list {
  background-color: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 8px var(--shadow-color, rgba(0, 0, 0, 0.08));
  border: 1px solid var(--border-color, #E5E5E5);
  margin-top: 12px;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--border-color, #E5E5E5);
}

.list-title {
  color: var(--header-color, #333);
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
  background-color: var(--primary-color, #8D1D21);
  border-radius: 1.5px;
}

.chapter-count {
  font-size: 11px;
  color: #777;
  background-color: var(--tag-bg, rgba(37, 71, 106, 0.08));
  padding: 1px 6px;
  border-radius: 8px;
}

.chapters-container {
  overflow-y: auto;
  overscroll-behavior: contain;
  flex: 1;
  scrollbar-width: thin;
  -ms-overflow-style: none;
  min-height: 200px;
}

.chapters-container::-webkit-scrollbar {
  width: 4px;
}

.chapters-container::-webkit-scrollbar-track {
  background: transparent;
}

.chapters-container::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
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
  background-color: var(--chapter-hover, rgba(141, 29, 33, 0.05));
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
  background-color: var(--accent-color, #25476A);
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
  color: var(--text-color, #333);
  margin: 0;
  transition: color 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: normal;
}

.chapter-item:active .chapter-title {
  color: var(--primary-color, #8D1D21);
}

.chapter-arrow {
  color: #ccc;
  font-size: 13px;
  flex-shrink: 0;
  transition: all 0.2s;
}

.chapter-item:active .chapter-arrow {
  color: var(--accent-color, #25476A);
  transform: translateX(2px);
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  min-height: 300px;
}

.loading-text {
  margin-top: 15px;
  color: #666;
  font-size: 14px;
}

/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  min-height: 300px;
}

.error-text {
  margin-top: 15px;
  color: #d32f2f;
  font-size: 14px;
  text-align: center;
  max-width: 80%;
}

.retry-button {
  margin-top: 20px;
  background-color: var(--primary-color, #8D1D21);
  color: white;
  border: none;
  border-radius: 20px;
  padding: 8px 25px;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  transition: all 0.2s;
}

.retry-button:hover {
  background-color: #7a1a1d;
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.3);
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 0;
  min-height: 300px;
}

.empty-chapters {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  padding: 20px 0;
}
</style>