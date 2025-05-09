<template>
  <div class="reader-container">
    <!-- 页面顶部信息栏 -->
    <div class="reader-header">
      <div class="header-left">
        <div class="chapter-info">
          <h2 class="chapter-title">{{ chapter?.title || '加载中...' }}</h2>
          <div class="category-controls-wrapper">
            <div class="book-category">{{ book?.category || '' }}</div>
            <div class="aligned-controls">
              <button class="control-icon-btn" 
                      :class="{ 'playing': isVoiceReading, 'paused': audioState.paused }" 
                      @click="toggleVoiceReading" 
                      title="语音朗读">
                <van-icon :name="getAudioPlayerIcon()" />
                <span class="btn-status-indicator" v-if="isVoiceReading"></span>
              </button>
              <button class="control-icon-btn home-btn" 
                      @click="goToIndex" 
                      title="返回目录">
                <van-icon name="home-o" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <div class="header-right">
        <div class="book-info">
          <h3 class="book-name">{{ book?.title || '' }}</h3>
          <div class="book-author">{{ book?.author || '' }}</div>
        </div>
      </div>
    </div>
    
    <!-- 内容区域 -->
    <div v-if="chapter" class="reader-content">
      <div class="page-perspective-container">
        <transition :name="pageTransitionName">
          <div :key="currentPage" class="page-content" ref="pageContentRef">
            <div v-for="(item, index) in currentPageContent" :key="index" class="content-item">
              <!-- 文本内容 -->
              <div 
                v-if="item.type === 'text'" 
                class="text-content"
                :class="{ 'text-selected': selectedParagraphIndex === index }"
                :data-item-index="index"
                v-html="item.data"
                @click="handleParagraphClick($event, item, index)"
              ></div>
              
              <!-- 图片内容 -->
              <div v-else-if="item.type === 'image'" class="image-content">
                <div class="media-label"><van-icon name="photo-o" /> 图片</div>
                <div class="zoomable-image" @click="toggleImageZoom($event)">
                  <img :src="item.src" :alt="item.caption || '图片'" />
                  <div class="zoom-hint">
                    <van-icon name="search" /> 点击放大
                  </div>
                </div>
                <!-- <div class="image-caption" v-if="item.caption">{{ item.caption }}</div> -->
              </div>
              
              <!-- 视频内容 -->
              <div v-else-if="item.type === 'video'" class="video-content">
                <div class="media-label"><van-icon name="video-o" /> 视频</div>
                <video controls class="video-player" :poster="item.poster">
                  <source :src="item.src" type="video/mp4">
                  您的浏览器不支持视频播放
                </video>
                <!-- <div class="video-title">{{ item.title || '视频' }}</div> -->
              </div>
              
              <!-- 音频内容 -->
              <div v-else-if="item.type === 'audio'" class="audio-content">
                <div class="media-label"><van-icon name="music-o" /> 音频</div>
                <div class="audio-player">
                  <div class="audio-title">{{ item.title || '音频' }}</div>
                  <div class="audio-controls">
                    <button class="audio-btn" @click="toggleAudio(item.src)">
                      {{ isCurrentAudioPlaying(item.src) ? '暂停' : '播放' }}
                    </button>
                    <div class="audio-progress">
                      <div class="progress-bar">
                        <div class="progress-fill" :style="{ width: audioProgress + '%' }"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- 文档内容 -->
              <div v-else-if="item.type === 'document'" class="document-content">
                <div class="media-label"><van-icon name="description" /> 文档</div>
                <div class="document-item">
                  <div class="document-icon" :class="[`file-${getDocumentType(item.format)}`]">
                    <van-icon :name="getDocumentIconName(item.format)" />
                  </div>
                  <div class="document-info">
                    <div class="document-title">{{ item.title }}</div>
                    <div class="document-format">{{ getDocumentFormatLabel(item.format) }}</div>
                  </div>
                  <button class="document-btn" @click="downloadDocument(item)">下载</button>
                </div>
              </div>
            </div>
          </div>
        </transition>
        
        <!-- 虚拟下一页 (用于翻页动画) -->
        <div v-if="showVirtualPage" class="virtual-page" :class="virtualPageClass" ref="virtualPageRef">
          <div v-for="(item, index) in virtualPageContent" :key="index" class="content-item">
            <div v-if="item.type === 'text'" class="text-content" v-html="item.data"></div>
            <!-- 其他类型内容的简化版本 -->
            <div v-else-if="item.type === 'image'" class="image-content-simplified">
              <img :src="item.src" :alt="item.caption || '图片'" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="loading-state">
      <van-loading type="spinner" color="#8D1D21" />
      <p>正在加载章节内容...</p>
    </div>
    
    <!-- 固定在底部的页面导航 -->
    <div class="page-navigation" v-if="chapter">
      <button 
        class="page-nav-btn prev-btn" 
        :disabled="!chapter || currentPage === 0"
        @click="prevPage"
      >
        上一页
      </button>
      
      <div class="page-indicator">
        <span>{{ currentPage + 1 }}/{{ chapter.totalPages }}</span>
      </div>
      
      <button 
        class="page-nav-btn next-btn" 
        :disabled="!chapter || currentPage >= (chapter?.totalPages - 1)"
        @click="nextPage"
      >
        下一页
      </button>
    </div>
    
    <!-- 图片查看器 -->
    <div class="image-viewer" v-if="showImageViewer" @click="closeImageViewer">
      <div class="image-viewer-content" 
           :style="{ transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageZoom})` }"
           @mousedown="startDrag"
           @touchstart="startDrag"
           @click.stop>
        <img :src="currentImage" alt="查看大图" draggable="false" />
        <div class="close-button" @click.stop="closeImageViewer">×</div>
      </div>
      <div class="image-controls">
        <button class="zoom-button" @click.stop="zoomIn"><van-icon name="plus" /></button>
        <button class="zoom-button" @click.stop="zoomOut"><van-icon name="minus" /></button>
        <button class="zoom-button" @click.stop="resetView"><van-icon name="replay" /></button>
      </div>
      <div class="zoom-level">{{ Math.round(imageZoom * 100) }}%</div>
      <div class="image-drag-hint" v-if="imageZoom > 1">
        <van-icon name="arrow" /> 拖动查看图片其他部分
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useBookStore } from '../stores/bookStore';
import { showToast, showLoadingToast, closeToast } from 'vant';

// 获取文档类型对应的Vant图标名的全局映射
const DOCUMENT_ICON_MAP = {
  'pdf': 'file-o',
  'doc': 'description',
  'docx': 'description',
  'txt': 'notes-o',
  'xls': 'bar-chart-o',
  'xlsx': 'bar-chart-o',
  'csv': 'bar-chart-o',
  'ppt': 'slide',
  'pptx': 'slide',
  'md': 'markdown-o',
  'markdown': 'markdown-o',
  'json': 'code-o',
  'xml': 'code-o',
  'html': 'code-o',
  'htm': 'code-o',
  'zip': 'archive',
  'rar': 'archive',
  '7z': 'archive',
  'default': 'file-o'
};

const route = useRoute();
const router = useRouter();
const bookStore = useBookStore();
const { book } = storeToRefs(bookStore);

// 从 store 获取当前章节
const chapter = computed(() => bookStore.currentChapter);
const currentPage = computed(() => bookStore.currentPage);
const currentPageContent = computed(() => bookStore.currentPageContent);
const isLoading = computed(() => bookStore.isLoading);
const hasError = computed(() => bookStore.hasError);

// 当前选中的段落索引
const selectedParagraphIndex = ref(-1);

// 引用页面内容元素
const pageContentRef = ref(null);
const virtualPageRef = ref(null);

// 翻页动画效果控制
const pageTransitionName = ref('page-flip-right');
const showVirtualPage = ref(false);
const virtualPageClass = ref('');
const virtualPageContent = ref([]);

// 图片查看
const showImageViewer = ref(false);
const currentImage = ref('');
const imageZoom = ref(1); // 图片缩放比例
const imagePosition = reactive({ x: 0, y: 0 }); // 图片位置
const isDragging = ref(false);
const dragStart = reactive({ x: 0, y: 0 });
const lastPosition = reactive({ x: 0, y: 0 });

// 音频播放
const currentAudio = ref(null);
const audioSrc = ref('');
const isAudioPlaying = ref(false);
const audioProgress = ref(0);

// 语音朗读
const isVoiceReading = ref(false);
const speechSynthesis = ref(window.speechSynthesis);
const speechUtterance = ref(null);

// 在app.js或main.js中添加以下代码
const addIconPolyfillScript = () => {
  // 创建脚本元素
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.id = 'ue-icon-polyfill';
  
  // 设置脚本内容
  script.textContent = `
    // UEditor图标修复脚本
    (function() {
      // 透明GIF的base64编码
      const transparentGif = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      
      // 文件类型图标映射
      const fileTypeColors = {
        'pdf': 'rgba(226, 55, 39, 0.1)',
        'doc': 'rgba(43, 87, 154, 0.1)',
        'docx': 'rgba(43, 87, 154, 0.1)',
        'txt': 'rgba(77, 77, 77, 0.1)',
        'xls': 'rgba(33, 115, 70, 0.1)',
        'xlsx': 'rgba(33, 115, 70, 0.1)',
        'ppt': 'rgba(209, 72, 54, 0.1)',
        'pptx': 'rgba(209, 72, 54, 0.1)',
        'default': 'rgba(37, 71, 106, 0.1)'
      };
      
      // 1. 拦截XMLHttpRequest对象
      const origXHROpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function() {
        this.addEventListener('error', function() {
          const url = this.responseURL || arguments[1];
          if (url && url.includes('/static/UE/dialogs/attachment/fileTypeImages/icon_')) {
            // 阻止错误冒泡
            this.abort();
          }
        });
        
        // 检查是否是图标URL
        const url = arguments[1];
        if (url && typeof url === 'string' && url.includes('/static/UE/dialogs/attachment/fileTypeImages/icon_')) {
          // 替换为内存中的数据URL
          arguments[1] = 'data:image/gif;base64,' + transparentGif;
        }
        
        return origXHROpen.apply(this, arguments);
      };
      
      // 2. 拦截Image对象
      const origImageSrc = Object.getOwnPropertyDescriptor(Image.prototype, 'src');
      Object.defineProperty(Image.prototype, 'src', {
        set: function(value) {
          if (value && typeof value === 'string' && value.includes('/static/UE/dialogs/attachment/fileTypeImages/icon_')) {
            // 提取文件类型
            const fileType = value.split('icon_')[1]?.split('.')[0] || 'default';
            
            // 设置内联样式
            this.style.width = '16px';
            this.style.height = '16px';
            this.style.display = 'inline-block';
            this.style.backgroundColor = fileTypeColors[fileType] || fileTypeColors.default;
            this.style.borderRadius = '50%';
            this.style.verticalAlign = 'middle';
            
            // 设置为透明GIF
            value = 'data:image/gif;base64,' + transparentGif;
          }
          
          return origImageSrc.set.call(this, value);
        },
        get: function() {
          return origImageSrc.get.call(this);
        }
      });
      
      // 3. 拦截fetch API
      const origFetch = window.fetch;
      window.fetch = function(input, init) {
        if (typeof input === 'string' && input.includes('/static/UE/dialogs/attachment/fileTypeImages/icon_')) {
          // 创建一个已解析的响应
          return Promise.resolve(
            new Response(
              Uint8Array.from(atob(transparentGif), c => c.charCodeAt(0)),
              { 
                status: 200, 
                headers: new Headers({ 'Content-Type': 'image/gif' })
              }
            )
          );
        }
        
        return origFetch.apply(this, arguments);
      };
      
      // 4. 添加样式
      const style = document.createElement('style');
      style.textContent = \`
        /* UEditor图标修复CSS */
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_"] {
          width: 16px !important;
          height: 16px !important;
          display: inline-block !important;
          vertical-align: middle !important;
          border-radius: 50% !important;
        }
        
        /* 特定文件类型样式 */
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_pdf.gif"] {
          background-color: rgba(226, 55, 39, 0.1) !important;
        }
        
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_doc.gif"],
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_docx.gif"] {
          background-color: rgba(43, 87, 154, 0.1) !important;
        }
        
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_txt.gif"] {
          background-color: rgba(77, 77, 77, 0.1) !important;
        }
        
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_xls.gif"],
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_xlsx.gif"] {
          background-color: rgba(33, 115, 70, 0.1) !important;
        }
        
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_ppt.gif"],
        img[src*="/static/UE/dialogs/attachment/fileTypeImages/icon_pptx.gif"] {
          background-color: rgba(209, 72, 54, 0.1) !important;
        }
      \`;
      
      document.head.appendChild(style);
      
      console.log('UEditor图标修复已启用');
    })();
  `;
  
  // 立即添加到页面头部并执行
  document.head.appendChild(script);
};

// 在应用启动时立即执行
addIconPolyfillScript();// 扩展获取文档图标名称函数，支持更多类型
const getDocumentIconName = (format) => {
  if (!format) return DOCUMENT_ICON_MAP.default;
  
  const formatLower = String(format).toLowerCase();
  return DOCUMENT_ICON_MAP[formatLower] || DOCUMENT_ICON_MAP.default;
};

// 获取文档类型函数
const getDocumentType = (format) => {
  if (!format) return 'generic';
  
  const formatLower = String(format).toLowerCase();
  
  // 为不同文件类型返回不同的类型名
  if (formatLower === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(formatLower)) return 'word';
  if (formatLower === 'txt') return 'text';
  if (['xls', 'xlsx', 'csv'].includes(formatLower)) return 'excel';
  if (['ppt', 'pptx'].includes(formatLower)) return 'ppt';
  if (['md', 'markdown'].includes(formatLower)) return 'markdown';
  if (['json', 'xml', 'html', 'htm'].includes(formatLower)) return 'code';
  if (['zip', 'rar', '7z'].includes(formatLower)) return 'archive';
  
  // 默认类型
  return 'generic';
};

// 简化后的朗读状态对象 - 移除了与自动翻页、高亮相关的属性
const readingState = reactive({
  contentElement: null   // 当前的内容元素
});

// 音频播放状态
const audioState = reactive({
  paused: false        // 是否处于暂停状态
});

// 设备检测
const detectDevice = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // 检测是否为移动设备
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  
  // 检测特定浏览器
  const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
  const isAndroid = /Android/i.test(userAgent);
  const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
  const isChrome = /Chrome/i.test(userAgent);
  const isFirefox = /Firefox/i.test(userAgent);
  const isWeChat = /MicroMessenger/i.test(userAgent);
  
  // 检测是否支持特定API
  const supportsSpeechSynthesis = 'speechSynthesis' in window;
  
  return {
    isMobileDevice,
    isIOS,
    isAndroid,
    isSafari,
    isChrome,
    isFirefox,
    isWeChat,
    supportsSpeechSynthesis,
    hasFullSpeechSupport: !(isMobileDevice && (isSafari || isWeChat))
  };
};

// 在script setup中添加设备检测状态
const deviceInfo = reactive(detectDevice());

// 确保语音列表已加载的函数
const ensureVoicesLoaded = () => {
  return new Promise((resolve) => {
    // 获取当前可用的声音列表
    let voices = speechSynthesis.value.getVoices();
    
    // 如果声音列表已加载，直接返回
    if (voices && voices.length > 0) {
      console.log(`已加载${voices.length}个语音`);
      resolve(voices);
      return;
    }
    
    // 如果声音列表为空，监听voiceschanged事件
    console.log("等待语音列表加载...");
    const voicesChangedHandler = () => {
      voices = speechSynthesis.value.getVoices();
      console.log(`语音列表加载完成，共${voices.length}个语音`);
      speechSynthesis.value.removeEventListener('voiceschanged', voicesChangedHandler);
      resolve(voices);
    };
    
    // 添加事件监听
    speechSynthesis.value.addEventListener('voiceschanged', voicesChangedHandler);
    
    // 设置超时保障，确保即使事件未触发也能继续
    setTimeout(() => {
      if (!voices || voices.length === 0) {
        console.warn("语音列表加载超时，使用默认设置");
        speechSynthesis.value.removeEventListener('voiceschanged', voicesChangedHandler);
        resolve([]);
      }
    }, 3000); // 3秒超时
  });
};

// 应用中文男声设置
const applyMaleVoiceSettings = (utterance) => {
  if (!utterance) return;
  
  // 设置语音为中文
  utterance.lang = 'zh-CN';
  
  // 获取所有可用声音
  const voices = speechSynthesis.value.getVoices();
  
  // 查找中文男声的优先顺序
  const voicePriorities = [
    // 查找中文男声
    (v) => v.lang.includes('zh') && (v.name.includes('Male') || v.name.includes('男')),
    // 备选：任何中文声音
    (v) => v.lang.includes('zh'),
    // 备选：任何男声
    (v) => v.name.includes('Male') || v.name.includes('男'),
    // 最后备选：任何声音
    (v) => true
  ];
  
  // 按优先级查找合适的声音
  let selectedVoice = null;
  for (const priorityCheck of voicePriorities) {
    selectedVoice = voices.find(priorityCheck);
    if (selectedVoice) break;
  }
  
  // 应用找到的声音
  if (selectedVoice) {
    console.log(`使用语音: ${selectedVoice.name} (${selectedVoice.lang})`);
    utterance.voice = selectedVoice;
  } else {
    console.warn("未找到合适的语音，使用默认设置");
  }
  
  // 降低语速 (默认是1，范围0.1-10，降低为0.8)
  utterance.rate = 0.8;
  
  // 增加音调使声音更有磁性 (默认是1，范围0-2)
  utterance.pitch = 0.9;
  
  // 增加音量，确保在移动设备上足够响亮
  utterance.volume = 1.0; // 最大音量
  
  return utterance;
};

// 显示通知信息
const showNotification = (message) => {
  // 创建一个通知元素
  const notificationEl = document.createElement('div');
  notificationEl.className = 'reading-status-indicator';
  notificationEl.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="reading-icon">
      <path d="M11 5L6 9H2v6h4l5 4zM15.54 8.46a5 5 0 0 1 0 7.07"></path>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
    </svg>
    ${message}
  `;
  
  // 添加到文档
  document.body.appendChild(notificationEl);
  
  // 2.5秒后移除通知
  setTimeout(() => {
    if (document.body.contains(notificationEl)) {
      notificationEl.style.opacity = '0';
      notificationEl.style.transform = 'translate(-50%, -20px)';
      notificationEl.style.transition = 'opacity 0.5s, transform 0.5s';
      
      // 动画结束后移除元素
      setTimeout(() => {
        if (document.body.contains(notificationEl)) {
          document.body.removeChild(notificationEl);
        }
      }, 500);
    }
  }, 2500);
};

// 处理段落点击事件 - 简化版，只做选择，不做高亮
const handleParagraphClick = (event, item, index) => {
  // 如果正在播放，先停止
  if (isVoiceReading.value) {
    stopVoiceReading();
  }

  // 如果点击的是已选中的段落，则取消选择
  if (selectedParagraphIndex.value === index) {
    selectedParagraphIndex.value = -1;
    return;
  }

  // 设置当前选中的段落索引
  selectedParagraphIndex.value = index;
  
  // 保存当前内容元素
  readingState.contentElement = event.currentTarget;
};

// 语音朗读函数 - 简化版，只朗读选中的段落
const toggleVoiceReading = () => {
  // 如果正在播放，停止播放
  if (isVoiceReading.value) {
    stopVoiceReading();
    return;
  }
  
  // 检查是否有选中的段落
  if (selectedParagraphIndex.value === -1) {
    showNotification("请选择需要播报的内容");
    return;
  }
  
  // 开始朗读选中的段落
  startVoiceReading();
};

// 开始语音朗读 - 简化版，只读选中的段落，无高亮和翻页
const startVoiceReading = () => {
  // 停止任何正在进行的朗读
  if (speechUtterance.value) {
    speechSynthesis.value.cancel();
  }
  
  // 获取选中的段落
  const selectedItem = currentPageContent.value.find((item, idx) => 
    idx === selectedParagraphIndex.value && item.type === 'text'
  );
  
  if (!selectedItem) {
    console.log("未找到可朗读的文本内容");
    return;
  }
  
  try {
    // 提取纯文本
    const plainText = selectedItem.data.replace(/<[^>]*>/g, '');
    
    if (!plainText || plainText.trim() === '') {
      console.log("选中的文本为空");
      return;
    }
    
    // 更新状态
    isVoiceReading.value = true;
    audioState.paused = false;
    
    // 创建语音合成对象
    speechUtterance.value = new SpeechSynthesisUtterance(plainText);
    
    // 加载语音和应用设置
    ensureVoicesLoaded().then(() => {
      // 应用语音设置
      applyMaleVoiceSettings(speechUtterance.value);
      
      // 设置结束事件处理
      speechUtterance.value.onend = () => {
        isVoiceReading.value = false;
        audioState.paused = false;
      };
      
      // 设置错误事件处理
      speechUtterance.value.onerror = (event) => {
        console.error("语音合成错误:", event);
        isVoiceReading.value = false;
      };
      
      // 开始朗读
      speechSynthesis.value.speak(speechUtterance.value);
    });
  } catch (error) {
    console.error("开始语音朗读时出错:", error);
    isVoiceReading.value = false;
  }
};

// 停止语音朗读 - 简化版
const stopVoiceReading = () => {
  // 清除语音合成
  if (speechSynthesis.value) {
    speechSynthesis.value.cancel();
    isVoiceReading.value = false;
    audioState.paused = false;
  }
};

// 语音初始化
const initSpeechSynthesis = () => {
  // 确保语音合成API可用
  if (!('speechSynthesis' in window)) {
    console.error("此浏览器不支持Web Speech API");
    return false;
  }
  
  try {
    // 使用全局引用
    speechSynthesis.value = window.speechSynthesis;
    
    // 尝试初始化和激活语音系统
    const testUtterance = new SpeechSynthesisUtterance("测试");
    testUtterance.volume = 0.01; // 非常低的音量
    testUtterance.rate = 1;
    testUtterance.onend = () => {
      console.log("语音合成初始化成功");
    };
    
    // 取消可能存在的语音队列
    speechSynthesis.value.cancel();
    
    // 尝试激活语音合成
    speechSynthesis.value.speak(testUtterance);
    
    return true;
  } catch (error) {
    console.error("语音合成初始化失败:", error);
    return false;
  }
};

// 停止所有媒体播放
const stopAllMedia = () => {
  // 停止音频
  if (currentAudio.value) {
    currentAudio.value.pause();
    isAudioPlaying.value = false;
  }
  
  // 停止语音朗读
  stopVoiceReading();
};

// 获取音频播放器图标
const getAudioPlayerIcon = () => {
  if (isVoiceReading.value) {
    return 'pause-circle-o'; // 播放中状态显示暂停图标
  } else if (audioState.paused) {
    return 'play-circle-o'; // 暂停状态显示播放图标
  } else {
    return 'play-circle-o'; // 初始状态显示播放图标
  }
};

// 章节加载函数
const loadChapterContent = async (chapterId) => {
  try {
    if (!chapterId || typeof chapterId !== 'string' || chapterId.trim() === '') {
      console.error('无效的章节ID');
      showToast('无效的章节ID');
      return;
    }
    
    // 显示加载状态
    showLoadingToast({
      message: '加载章节内容...',
      forbidClick: true,
      duration: 0
    });

    // 重置状态
    stopAllMedia();
    showVirtualPage.value = false;
    selectedParagraphIndex.value = -1;
    
    // 调用 store 的方法加载章节内容
    // 现在直接传递 chapterId - store会使用它来获取章节内容
    await bookStore.loadChapter(chapterId);
    
    // 关闭加载提示
    closeToast();
    
    // 滚动到顶部
    window.scrollTo(0, 0);
  } catch (error) {
    console.error('加载章节内容失败:', error);
    closeToast();
    
    showToast({
      message: `加载章节失败: ${error.message || '未知错误'}`,
      type: 'fail'
    });
  }
};

// 预加载虚拟页面内容
const preloadVirtualPage = (direction) => {
  if (!chapter.value || !chapter.value.pages) return null;
  
  // 确定需要加载的页面索引
  let targetPage;
  if (direction === 'next' && currentPage.value < chapter.value.totalPages - 1) {
    targetPage = currentPage.value + 1;
    virtualPageClass.value = 'virtual-page-next';
  } else if (direction === 'prev' && currentPage.value > 0) {
    targetPage = currentPage.value - 1;
    virtualPageClass.value = 'virtual-page-prev';
  } else {
    // 无效的翻页方向或已经在边界页
    return null;
  }
  
  try {
    // 加载目标页面内容
    virtualPageContent.value = chapter.value.pages[targetPage] || [];
    return targetPage;  // 返回目标页面索引
  } catch (error) {
    console.error("预加载页面内容时出错:", error);
    return null;
  }
};

// 监听路由参数变化，加载对应章节内容
watch(() => route.params.chapterId, (newId) => {
  if (newId) {
    console.log('路由参数中的章节ID:', newId);
    
    // 检查路由中是否有 uniqueCodeId 参数，如果有则先设置
    const routeUniqueCodeId = route.query.uniqueCodeId;
    if (routeUniqueCodeId) {
      console.log('从路由获取的 uniqueCodeId:', routeUniqueCodeId);
      // 设置 uniqueCodeId 并在完成后加载章节
      bookStore.setUniqueCodeId(routeUniqueCodeId)
        .then(() => {
          loadChapterContent(newId);
        })
        .catch(error => {
          console.error('设置 uniqueCodeId 失败:', error);
          // 仍然尝试加载章节
          loadChapterContent(newId);
        });
    } else {
      // 直接加载章节内容
      loadChapterContent(newId);
    }
  }
}, { immediate: true });

// 翻页功能
const prevPage = () => {
  // 使用 store 的方法控制翻页
  if (bookStore.prevPage()) {
    // 如果正在朗读，停止朗读
    if (isVoiceReading.value) {
      stopVoiceReading();
    }
    
    // 预加载上一页内容，准备动画
    virtualPageContent.value = chapter.value.pages[currentPage.value] || [];
    virtualPageClass.value = 'virtual-page-prev';
    
    // 确保在下一帧再显示虚拟页
    nextTick(() => {
      showVirtualPage.value = true;
      
      // 设置翻页动画方向
      pageTransitionName.value = 'page-flip-left';
      
      // 滚动到顶部和重置段落选择
      window.scrollTo(0, 0);
      selectedParagraphIndex.value = -1;
      
      // 等待页面渲染完成后再隐藏虚拟页
      setTimeout(() => {
        showVirtualPage.value = false;
      }, 300);
    });
  }
};

const nextPage = () => {
  // 使用 store 的方法控制翻页
  if (bookStore.nextPage()) {
    // 如果正在朗读，停止朗读
    if (isVoiceReading.value) {
      stopVoiceReading();
    }
    
    // 预加载下一页内容，准备动画
    preloadVirtualPage('next');
    
    // 设置翻页动画方向
    pageTransitionName.value = 'page-flip-right';
    
    // 先显示虚拟页，确保DOM已更新
    nextTick(() => {
      showVirtualPage.value = true;
      
      // 滚动到顶部和重置段落选择
      window.scrollTo(0, 0);
      selectedParagraphIndex.value = -1;
      
      // 等待页面渲染完成后再隐藏虚拟页
      setTimeout(() => {
        showVirtualPage.value = false;
      }, 300);
    });
  }
};

// 处理图片缩放
const toggleImageZoom = (event) => {
  const img = event.target;
  if (img.tagName === 'IMG') {
    currentImage.value = img.src;
    showImageViewer.value = true;
  }
};

const closeImageViewer = () => {
  showImageViewer.value = false;
  resetView();
};

// 图片缩放功能
const zoomIn = () => {
  imageZoom.value = Math.min(imageZoom.value + 0.2, 3); // 最大放大3倍
};

const zoomOut = () => {
  imageZoom.value = Math.max(imageZoom.value - 0.2, 0.5); // 最小缩小到0.5倍
  // 如果缩小到接近原始尺寸，重置位置
  if (imageZoom.value <= 1.1) {
    imagePosition.x = 0;
    imagePosition.y = 0;
  }
};

const resetView = () => {
  imageZoom.value = 1; // 重置缩放
  imagePosition.x = 0; // 重置X位置
  imagePosition.y = 0; // 重置Y位置
};

// 图片拖动功能
const startDrag = (event) => {
  // 只有放大状态才能拖动
  if (imageZoom.value <= 1) return;
  
  event.preventDefault();
  isDragging.value = true;
  
  // 获取初始位置 (支持鼠标和触摸)
  if (event.type === 'mousedown') {
    dragStart.x = event.clientX;
    dragStart.y = event.clientY;
  } else if (event.type === 'touchstart') {
    dragStart.x = event.touches[0].clientX;
    dragStart.y = event.touches[0].clientY;
  }
  
  // 保存当前位置作为基准
  lastPosition.x = imagePosition.x;
  lastPosition.y = imagePosition.y;
  
  // 添加移动和结束事件监听
  if (event.type === 'mousedown') {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', endDrag);
  } else if (event.type === 'touchstart') {
    window.addEventListener('touchmove', handleDrag, { passive: false });
    window.addEventListener('touchend', endDrag);
  }
};

const handleDrag = (event) => {
  if (!isDragging.value) return;
  
  let currentX, currentY;
  
  // 获取当前位置 (支持鼠标和触摸)
  if (event.type === 'mousemove') {
    currentX = event.clientX;
    currentY = event.clientY;
  } else if (event.type === 'touchmove') {
    event.preventDefault(); // 防止页面滚动
    currentX = event.touches[0].clientX;
    currentY = event.touches[0].clientY;
  }
  
  // 计算移动距离
  const deltaX = currentX - dragStart.x;
  const deltaY = currentY - dragStart.y;
  
  // 应用新位置
  imagePosition.x = lastPosition.x + deltaX;
  imagePosition.y = lastPosition.y + deltaY;
};

const endDrag = () => {
  isDragging.value = false;
  
  // 移除事件监听
  window.removeEventListener('mousemove', handleDrag);
  window.removeEventListener('mouseup', endDrag);
  window.removeEventListener('touchmove', handleDrag);
  window.removeEventListener('touchend', endDrag);
};

// 获取文档格式标签
const getDocumentFormatLabel = (format) => {
  switch (format.toLowerCase()) {
    case 'pdf': return 'PDF文档';
    case 'docx': case 'doc': return 'Word文档';
    case 'txt': return '文本文件';
    case 'xlsx': case 'xls': return 'Excel表格';
    case 'pptx': case 'ppt': return 'PowerPoint演示文稿';
    case 'md': case 'markdown': return 'Markdown文档';
    case 'csv': return 'CSV数据表';
    case 'json': return 'JSON数据';
    case 'xml': return 'XML文档';
    case 'html': case 'htm': return 'HTML网页';
    case 'zip': return 'ZIP压缩包';
    case 'rar': return 'RAR压缩包';
    case '7z': return '7Z压缩包';
    default: return '文档';
  }
};

// 音频处理
const toggleAudio = (src) => {
  if (audioSrc.value === src && isAudioPlaying.value) {
    pauseAudio();
  } else {
    if (audioSrc.value !== src) {
      if (currentAudio.value) {
        currentAudio.value.pause();
      }
      audioSrc.value = src;
      currentAudio.value = new Audio(src);
      audioProgress.value = 0;
      
      currentAudio.value.addEventListener('timeupdate', updateAudioProgress);
    }
    playAudio();
  }
};

const isCurrentAudioPlaying = (src) => {
  return audioSrc.value === src && isAudioPlaying.value;
};

const playAudio = () => {
  if (currentAudio.value) {
    currentAudio.value.play();
    isAudioPlaying.value = true;
  }
};

const pauseAudio = () => {
  if (currentAudio.value) {
    currentAudio.value.pause();
    isAudioPlaying.value = false;
  }
};

const updateAudioProgress = () => {
  if (currentAudio.value) {
    const progress = (currentAudio.value.currentTime / currentAudio.value.duration) * 100;
    audioProgress.value = progress || 0;
  }
};

// 导航到目录页
const goToIndex = () => {
  router.push('/');
};

// 处理页面可见性变化
const handleVisibilityChange = () => {
  if (document.hidden) {
    // 页面不可见时，如果正在朗读，停止朗读
    if (isVoiceReading.value) {
      stopVoiceReading();
    }
  }
};

// 更新导航栏可见性
const updateNavigationVisibility = () => {
  const navElement = document.querySelector('.page-navigation');
  const contentElement = document.querySelector('.reader-content');
  
  if (navElement && contentElement) {
    // 始终保持导航栏可见，并确保在底部
    navElement.style.position = 'fixed';
    navElement.style.bottom = '0';
    navElement.style.left = '0';
    navElement.style.right = '0';
    navElement.style.zIndex = '50';
  }
};

// 调整内容区高度以适应屏幕
const adjustContentHeight = () => {
  // 获取视口高度
  const viewportHeight = window.innerHeight;
  
  // 获取头部高度
  const headerElement = document.querySelector('.reader-header');
  const headerHeight = headerElement ? headerElement.offsetHeight : 0;
  
  // 获取导航栏高度
  const navElement = document.querySelector('.page-navigation');
  const navHeight = navElement ? navElement.offsetHeight : 0;
  
  // 计算内容区应有的高度 - 减去头部、导航栏和边距
  const contentHeight = viewportHeight - headerHeight - navHeight - 25;

  // 应用新高度
  const contentElement = document.querySelector('.reader-content');
  if (contentElement) {
    contentElement.style.height = `${contentHeight}px`;
    
    // 确保内容区有足够的底部边距，避免被导航栏遮挡
    contentElement.style.marginBottom = `${navHeight + 10}px`;
  }
};

// 组件挂载时
onMounted(() => {
  // 监听窗口大小变化，调整页面布局
  window.addEventListener('resize', adjustContentHeight);
  
  // 在组件挂载后先计算一次页面布局
  nextTick(() => {
    adjustContentHeight();

    // 检测设备特性
    console.log(`设备检测结果:`, deviceInfo);

    // 初始化语音合成
    if (deviceInfo.supportsSpeechSynthesis) {
      initSpeechSynthesis();
    } else {
      console.warn("此设备不支持语音合成API");
    }
    
    // 监听滚动事件，确保导航栏保持在底部
    const contentElement = document.querySelector('.reader-content .page-perspective-container');
    if (contentElement) {
      contentElement.addEventListener('scroll', updateNavigationVisibility);
    }
    
    // 如果支持 ResizeObserver API，使用它来监听内容区域的变化
    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(() => {
        adjustContentHeight();
      });
      
      if (contentElement) {
        resizeObserver.observe(contentElement);
      }
    }
  });
  
  // 设置页面可见性变化监听，用于在切换回页面时恢复语音状态
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

// 文档下载功能
const downloadDocument = async (doc) => {
  try {
    showLoadingToast({
      message: '准备下载...',
      forbidClick: true,
      duration: 0
    });
    
    // 获取文件内容
    const response = await fetch(doc.src);
    if (!response.ok) throw new Error(`获取文件失败: ${response.status}`);
    
    // 获取文件blob
    const blob = await response.blob();
    
    // 确定正确的MIME类型
    let mimeType = 'application/octet-stream'; // 默认二进制流
    let downloadBlob;
    
    // 根据文件格式设置正确的MIME类型
    const format = String(doc.format || '').toLowerCase();
    
    switch (format) {
      case 'pdf':
        mimeType = 'application/pdf';
        break;
      case 'txt':
        mimeType = 'text/plain;charset=utf-8';
        // 对于TXT文件，需要特殊处理以确保正确编码
        const text = await blob.text();
        downloadBlob = new Blob([text], { type: mimeType });
        break;
      case 'doc':
        mimeType = 'application/msword';
        break;
      case 'docx':
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        break;
      case 'xls':
        mimeType = 'application/vnd.ms-excel';
        break;
      case 'xlsx':
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case 'ppt':
        mimeType = 'application/vnd.ms-powerpoint';
        break;
      case 'pptx':
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        break;
      case 'md':
      case 'markdown':
        mimeType = 'text/markdown;charset=utf-8';
        const mdText = await blob.text();
        downloadBlob = new Blob([mdText], { type: mimeType });
        break;
      case 'csv':
        mimeType = 'text/csv;charset=utf-8';
        const csvText = await blob.text();
        downloadBlob = new Blob([csvText], { type: mimeType });
        break;
      case 'json':
        mimeType = 'application/json;charset=utf-8';
        const jsonText = await blob.text();
        downloadBlob = new Blob([jsonText], { type: mimeType });
        break;
      case 'xml':
        mimeType = 'application/xml;charset=utf-8';
        const xmlText = await blob.text();
        downloadBlob = new Blob([xmlText], { type: mimeType });
        break;
      case 'html':
      case 'htm':
        mimeType = 'text/html;charset=utf-8';
        const htmlText = await blob.text();
        downloadBlob = new Blob([htmlText], { type: mimeType });
        break;
      case 'zip':
        mimeType = 'application/zip';
        break;
      case 'rar':
        mimeType = 'application/x-rar-compressed';
        break;
      case '7z':
        mimeType = 'application/x-7z-compressed';
        break;
    }
    
    // 如果没有特殊处理，使用原始blob带正确的MIME类型
    if (!downloadBlob) {
      downloadBlob = new Blob([blob], { type: mimeType });
    }
    
    // 创建下载链接
    const url = URL.createObjectURL(downloadBlob);
    const a = window.document.createElement('a');
    a.href = url;
    
    // 设置下载文件名
    const filename = doc.title || '下载文件';
    a.download = `${filename}.${format}`;
    
    // 添加到文档并点击
    window.document.body.appendChild(a);
    a.click();
    
    // 清理
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    closeToast();
    showToast({
      message: '开始下载',
      position: 'bottom'
    });
  } catch (error) {
    console.error('下载文件时出错:', error);
    closeToast();
    showToast({
      message: `下载失败: ${error.message}`,
      type: 'fail'
    });
  }
};

// 组件卸载时清理资源
onUnmounted(() => {
  stopAllMedia();
  
  if (currentAudio.value) {
    currentAudio.value.removeEventListener('timeupdate', updateAudioProgress);
  }
  
  window.removeEventListener('resize', adjustContentHeight);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  
  // 移除滚动事件监听
  const contentElement = document.querySelector('.reader-content .page-perspective-container');
  if (contentElement) {
    contentElement.removeEventListener('scroll', updateNavigationVisibility);
  }
});
</script>

<style scoped>
:root {
  --primary-color: #8D1D21;
  --accent-color: #25476A;
  --background-color: #F5F5F5;
  --border-color: #E5E5E5;
  --shadow-color: rgba(0, 0, 0, 0.08);
  --header-color: #333;
  --tag-bg: rgba(37, 71, 106, 0.08);
}

.reader-container {
  min-height: 100vh;
  background-color: var(--background-color);
  position: relative;
  font-size: 16px;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* UEditor 图标替换样式 */
.replaced-icon.file-pdf {
  background-color: rgba(226, 55, 39, 0.1);
  color: #E23727;
}

.replaced-icon.file-doc, .replaced-icon.file-docx {
  background-color: rgba(43, 87, 154, 0.1);
  color: #2B579A;
}

.replaced-icon.file-txt {
  background-color: rgba(77, 77, 77, 0.1);
  color: #4D4D4D;
}

.replaced-icon.file-xls, .replaced-icon.file-xlsx, .replaced-icon.file-csv {
  background-color: rgba(33, 115, 70, 0.1);
  color: #217346;
}

.replaced-icon.file-ppt, .replaced-icon.file-pptx {
  background-color: rgba(209, 72, 54, 0.1);
  color: #D14836;
}

.replaced-icon.file-generic {
  background-color: rgba(37, 71, 106, 0.1);
  color: #25476A;
}.image-drag-hint {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 8px 15px;
  border-radius: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  animation: fade-in-out 3s forwards;
}

@keyframes fade-in-out {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; visibility: hidden; }
}

/* 页面头部和控制按钮 */
.reader-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 15px;
  background-color: white;
  border-bottom: 1px solid var(--border-color);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 1px 8px rgba(0,0,0,0.05);
}

.header-left {
  flex: 0.5 0 30%;
}

.header-center {
  flex: 0 0 40%;
  display: flex;
  justify-content: center;
}

.header-right {
  flex: 0.5 0 30%;
  text-align: right;
}

/* 添加到style部分 */
.header-controls {
  display: flex;
  align-items: flex-end;
  margin-top: 5px;
}

.inline-controls {
  display: flex;
  margin-left: 10px;
  gap: 8px;
}

.inline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  border: 1px solid var(--border-color);
  background-color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.inline-btn.audio-btn {
  color: var(--primary-color);
}

.inline-btn.audio-btn.playing {
  background-color: var(--primary-color);
  color: white;
}

.inline-btn.audio-btn.paused {
  background-color: #f9f9f9;
  border: 1px solid var(--primary-color);
}

.inline-btn.home-btn {
  color: var(--accent-color);
}

.inline-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

/* 移除之前的控制按钮代码 */
.header-center,
.control-buttons,
.control-btn {
  display: none;
}

.control-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  position: relative;
  bottom: -14px;
}

.control-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 4px;
  border: 1px solid var(--border-color);
  background-color: white;
  color: var(--primary-color);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.control-btn:hover {
  background-color: #f9f9f9;
}

.control-btn.audio-btn {
  background-color: var(--primary-color);
  color: white;
}

.control-btn.audio-btn:hover {
  background-color: #7a1a1d;
}

.control-btn.audio-btn.paused {
  background-color: #f9f9f9;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.control-btn.home-btn {
  background-color: white;
  color: var(--accent-color);
  border: 1px solid var(--accent-color);
}

.control-btn.home-btn:hover {
  background-color: var(--accent-color);
  color: white;
}

.control-btn .van-icon {
  font-size: 16px;
}

.chapter-info {
  display: flex;
  flex-direction: column;
}

.chapter-title {
  font-size: 17px;
  color: var(--primary-color);
  margin: 0;
  font-weight: 600;
  position: relative;
  display: inline-block;
  padding-bottom: 4px;
}

.chapter-title::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 30px;
  height: 2px;
  background-color: var(--primary-color);
  border-radius: 1px;
}

.book-category {
  font-size: 13px;
  color: var(--accent-color);
  margin-top: 5px;
  display: inline-flex;
  align-items: center;
  background-color: rgba(37, 71, 106, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
  max-width: 80px; /* 最大宽度 */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.book-info {
  text-align: right;
}

.book-name {
  font-size: 14px;
  margin: 0;
  color: var(--header-color);
  font-weight: 600;
  position: relative;
}

.book-name::after {
  content: '';
  position: absolute;
  bottom: -3px;
  right: 0;
  width: 20px;
  height: 1px;
  background-color: var(--header-color);
}

.book-author {
  font-size: 13px;
  color: #777;
  margin-top: 8px;
  font-style: italic;
}

/* 内容区域 */
.reader-content {
  padding: 15px;
  background-color: white;
  margin: 10px;
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-color);
  position: relative;
  background-image: 
    linear-gradient(rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 1%), 
    linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px);
  background-size: 100% 24px;
  flex: 1;
  overflow: hidden;
  margin-bottom: 65px; /* 为固定底部导航留出空间 */
}

.page-perspective-container {
  position: relative;
  transform-style: preserve-3d;
  perspective-origin: center;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.page-content {
  position: relative;
  height: 100%;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  transform-origin: center;
  background-color: white;
}

/* 虚拟页面样式 */
.virtual-page {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: -1;
  opacity: 0;
  transform: translateX(100%);
  padding: 0 10px;
  backface-visibility: hidden;
  transform-style: preserve-3d;
  pointer-events: none;
}

.virtual-page-next {
  transform: translateX(100%) rotateY(-10deg);
  transform-origin: left center;
  box-shadow: -5px 0 15px rgba(0,0,0,0.1);
}

.virtual-page-prev {
  transform: translateX(-100%) rotateY(10deg);
  transform-origin: right center;
  box-shadow: 5px 0 15px rgba(0,0,0,0.1);
}

.image-content-simplified {
  text-align: center;
  margin: 10px 0;
}

.image-content-simplified img {
  max-width: 100%;
  max-height: 100px;
  object-fit: cover;
  opacity: 0.7;
  border-radius: 4px;
}

.content-item {
  margin-bottom: 16px;
}

.text-content {
  font-size: 17px;
  line-height: 1.8;
  text-align: justify;
  color: #333;
  user-select: text; /* 确保文本可以选择 */
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  transition: background-color 0.3s ease;
  padding: 5px;
  border-radius: 4px;
  cursor: pointer;
}

/* 被选中的段落样式 */
.text-selected {
  background-color: rgba(141, 29, 33, 0.05);
  box-shadow: 0 1px 3px rgba(141, 29, 33, 0.1);
  border-left: 3px solid var(--primary-color);
  padding-left: 8px;
  color: #333;
}

/* 图片内容 */
.media-label {
  display: inline-flex;
  align-items: center;
  font-size: 11px;
  color: var(--accent-color);
  background-color: var(--tag-bg);
  padding: 2px 6px;
  border-radius: 10px;
  margin-bottom: 6px;
}

.media-label .van-icon {
  margin-right: 3px;
  font-size: 12px;
}

.image-content {
  margin: 16px 0;
  text-align: center;
}

.zoomable-image {
  position: relative;
  display: inline-block;
  max-width: 100%;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.zoomable-image img {
  max-width: 100%;
  display: block;
}

.zoom-hint {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: rgba(0,0,0,0.6);
  color: white;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.zoom-hint .van-icon {
  margin-right: 3px;
}

.image-caption {
  margin-top: 6px;
  font-size: 12px;
  color: #666;
  font-style: italic;
}

/* 视频内容 */
.video-content {
  margin: 16px 0;
}

.video-player {
  width: 100%;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  background-color: #000;
}

.video-title {
  margin-top: 6px;
  font-size: 12px;
  color: #666;
  text-align: center;
}

/* 音频内容 */
.audio-content {
  margin: 16px 0;
}

.audio-player {
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #eee;
}

.audio-title {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--accent-color);
}

.audio-controls {
  display: flex;
  align-items: center;
}

.audio-btn {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

.audio-progress {
  flex: 1;
  margin-left: 10px;
}

.progress-bar {
  height: 4px;
  background-color: #ddd;
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  transition: width 0.3s;
}

/* 文档内容 */
.document-content {
  margin: 16px 0;
}

.document-item {
  display: flex;
  align-items: center;
  background-color: #f9f9f9;
  border-radius: 6px;
  padding: 10px;
  border: 1px solid #eee;
  transition: all 0.2s ease;
}

.document-item:hover {
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-color: #ddd;
}

.document-icon {
  font-size: 24px;
  color: var(--accent-color);
  margin-right: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(37, 71, 106, 0.1);
  border-radius: 50%;
  transition: all 0.2s ease;
}

/* 文件类型图标的特定颜色 */
.document-icon.file-pdf {
  background-color: rgba(226, 55, 39, 0.1);
  color: #E23727;
}

.document-icon.file-word {
  background-color: rgba(43, 87, 154, 0.1);
  color: #2B579A;
}

.document-icon.file-text {
  background-color: rgba(77, 77, 77, 0.1);
  color: #4D4D4D;
}

.document-icon.file-excel {
  background-color: rgba(33, 115, 70, 0.1);
  color: #217346;
}

.document-icon.file-ppt {
  background-color: rgba(209, 72, 54, 0.1);
  color: #D14836;
}

.document-icon.file-markdown {
  background-color: rgba(0, 0, 0, 0.1);
  color: #000000;
}

.document-icon.file-code {
  background-color: rgba(0, 119, 170, 0.1);
  color: #0077AA;
}

.document-icon.file-archive {
  background-color: rgba(153, 102, 51, 0.1);
  color: #996633;
}

.document-info {
  flex: 1;
}

.document-title {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  word-break: break-word;
}

.document-format {
  font-size: 13px;
  color: #777;
  display: inline-block;
  padding: 2px 8px;
  background-color: rgba(37, 71, 106, 0.05);
  border-radius: 10px;
}

.document-btn {
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  text-align: center;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.document-btn:hover {
  background-color: #1d3a56;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.document-btn:active {
  transform: translateY(0);
  box-shadow: none;
}

/* 页码指示器和导航 - 固定在底部 */
.page-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: white;
  border-top: 1px solid var(--border-color);
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 55px;
  box-shadow: 0 -2px 8px rgba(0,0,0,0.1);
}

.page-indicator {
  text-align: center;
  color: #666;
  font-size: 14px;
  position: relative;
  font-weight: 500;
}

.page-indicator::before,
.page-indicator::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 15px;
  height: 1px;
  background-color: #ddd;
}

.page-indicator::before {
  left: -25px;
}

.page-indicator::after {
  right: -25px;
}

.page-nav-btn {
  background-color: white;
  color: var(--primary-color);
  border: 1px solid var(--border-color);
  border-radius: 15px;
  padding: 5px 15px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

.page-nav-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(255,255,255,0.8), rgba(255,255,255,0.4));
  opacity: 0;
  transition: opacity 0.2s;
}

.page-nav-btn:hover:not(:disabled)::before {
  opacity: 1;
}

.page-nav-btn:active:not(:disabled) {
  transform: translateY(1px);
}

.page-nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  color: #999;
  border-color: #e0e0e0;
  background-color: #f5f5f5;
}

/* 类别和控制按钮容器 */
.category-controls-wrapper {
  display: flex;
  align-items: center;
  margin-top: 5px;
  position: relative;
  height: 24px;
  align-items: flex-end;
  flex-wrap: nowrap;
  flex-direction: row;
}

.book-category {
  display: inline-flex;
  height: 100%;
  align-items: center;
  background-color: rgba(37, 71, 106, 0.08);
  padding: 2px 8px;
  border-radius: 10px;
  max-width: 80px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 13px;
  color: var(--accent-color);
}

.aligned-controls {
  display: flex;
  align-items: center;
  margin-left: 10px;
  height: 100%;
  gap: 10px;
}

/* 控制按钮样式 */
.control-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border-color);
  background-color: white;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  padding: 0;
  font-size: 14px;
}

.control-icon-btn.playing {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.control-icon-btn.paused {
  background-color: white;
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.control-icon-btn.home-btn {
  color: var(--accent-color);
}

.control-icon-btn.home-btn:hover {
  background-color: var(--accent-color);
  color: white;
}

.control-icon-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.btn-status-indicator {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #4CAF50;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 4px rgba(76, 175, 80, 0);
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 rgba(76, 175, 80, 0);
  }
}

/* 加载状态 */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  min-height: 300px;
}

.loading-state p {
  margin-top: 16px;
  color: #999;
  font-size: 13px;
}

/* 图片查看器 */
.image-viewer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.image-viewer-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  transition: transform 0.2s ease;
  transform-origin: center;
  cursor: move;
  user-select: none;
}

.image-viewer-content img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

.close-button {
  position: absolute;
  top: -40px;
  right: 0;
  color: white;
  font-size: 24px;
  cursor: pointer;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0,0,0,0.5);
  border-radius: 50%;
}

.image-controls {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 15px;
  background-color: rgba(0, 0, 0, 0.6);
  padding: 10px 15px;
  border-radius: 20px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.zoom-button {
  background-color: rgba(255, 255, 255, 0.2);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.zoom-button:hover {
  background-color: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.zoom-button:active {
  transform: scale(0.95);
}

.zoom-level {
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
}

/* 纸质书翻页效果 - 右翻效果 */
.page-flip-right-enter-active {
  animation: pageFlipInRight 0.4s ease-out forwards;
  transform-origin: left center;
  perspective: 1000px;
  z-index: 2;
}

.page-flip-right-leave-active {
  animation: pageFlipOutRight 0.4s ease-in forwards;
  transform-origin: left center;
  perspective: 1000px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

@keyframes pageFlipInRight {
  0% {
    opacity: 0.5;
    transform: rotateY(15deg) translateX(5%);
    box-shadow: -5px 0 10px rgba(0,0,0,0.15);
  }
  100% {
    opacity: 1;
    transform: rotateY(0) translateX(0);
    box-shadow: none;
  }
}

@keyframes pageFlipOutRight {
  0% {
    opacity: 1;
    transform: rotateY(0) translateX(0);
    box-shadow: none;
  }
  100% {
    opacity: 0;
    transform: rotateY(-15deg) translateX(-5%);
    box-shadow: 5px 0 10px rgba(0,0,0,0.1);
  }
}

/* 纸质书翻页效果 - 左翻效果 */
.page-flip-left-enter-active {
  animation: pageFlipInLeft 0.4s ease-out forwards;
  transform-origin: right center;
  perspective: 1000px;
  z-index: 2;
}

.page-flip-left-leave-active {
  animation: pageFlipOutLeft 0.4s ease-in forwards;
  transform-origin: right center;
  perspective: 1000px;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1;
}

@keyframes pageFlipInLeft {
  0% {
    opacity: 0.5;
    transform: rotateY(-15deg) translateX(-5%);
    box-shadow: 5px 0 10px rgba(0,0,0,0.15);
  }
  100% {
    opacity: 1;
    transform: rotateY(0) translateX(0);
    box-shadow: none;
  }
}

@keyframes pageFlipOutLeft {
  0% {
    opacity: 1;
    transform: rotateY(0) translateX(0);
    box-shadow: none;
  }
  100% {
    opacity: 0;
    transform: rotateY(15deg) translateX(5%);
    box-shadow: -5px 0 10px rgba(0,0,0,0.1);
  }
}

/* 通知弹窗 */
.reading-status-indicator {
  position: fixed !important;
  top: 15px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  background-color: rgba(141, 29, 33, 0.95) !important;
  color: white !important;
  padding: 10px 16px !important;
  border-radius: 20px !important;
  font-size: 14px !important;
  font-weight: bold !important;
  z-index: 9999 !important;  /* Extremely high z-index */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  min-width: 200px !important;
  text-align: center !important;
  pointer-events: none !important;  /* Prevent it from blocking clicks */
}

.reading-icon {
  font-size: 18px;
  margin-right: 8px !important;
  animation: pulse-icon 1s infinite !important;
}

@keyframes pulse-icon {
  0% { opacity: 0.7; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.7; transform: scale(1); }
}

@keyframes slide-in-out {
  0% { opacity: 0; transform: translate(-50%, -20px); }
  15% { opacity: 1; transform: translate(-50%, 0); }
  85% { opacity: 1; transform: translate(-50%, 0); }
  100% { opacity: 0; transform: translate(-50%, -20px); }
}

/* 错误消息样式 */
.error-message {
  padding: 15px;
  background-color: #fff5f5;
  border: 1px solid #ffebeb;
  border-radius: 4px;
  color: #d53f3f;
  margin: 10px 0;
}

.error-message h3 {
  margin-top: 0;
  color: #d53f3f;
}

.error-message ul {
  margin: 10px 0;
  padding-left: 20px;
}

.error-message p {
  margin: 5px 0;
}

/* 响应式设计 */
@media screen and (max-width: 480px) {
  .reader-header {
    padding: 8px 10px;
  }
  
  .header-left {
    flex: 0.5 0 50%;
  }
  
  .header-center {
    flex: 0 0 50%;
  }
  
  .header-right {
    flex: 0.5 0 25%;
  }
  
  .reader-content {
    margin: 5px;
    padding: 10px;
    margin-bottom: 60px;
  }
  
  .chapter-title {
    font-size: 14px;
  }
  
  .book-name {
    font-size: 11px;
  }
  
  .book-author {
    font-size: 10px;
    margin-top: 5px;
  }
  
  .text-content {
    font-size: 14px;
    line-height: 1.7;
  }
  
  .page-nav-btn {
    padding: 3px 8px;
    font-size: 12px;
  }
  
  .page-navigation {
    height: 50px;
    padding: 8px 10px;
  }
  
  .page-indicator {
    font-size: 12px;
  }
}
</style>