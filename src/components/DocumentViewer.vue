<template>
  <div class="document-viewer">
    <div class="document-info">
      <div class="document-title">{{ title }}</div>
      <div class="document-format">{{ formatLabel }}</div>
    </div>
    <div class="document-actions">
      <van-button type="primary" size="small" @click="toggleDocument">
        {{ isOpen ? '关闭' : '打开' }}
      </van-button>
    </div>
    <div class="document-preview" v-if="isOpen">
      <div class="document-frame">
        <!-- 加载状态 -->
        <div class="document-placeholder" v-if="loading">
          <div class="doc-icon">{{ formatIcon }}</div>
          <div class="doc-name">{{ title }}</div>
          <div class="doc-message">文档预览加载中...</div>
        </div>

        <!-- PDF预览 -->
        <div v-else-if="props.format === 'pdf'" class="pdf-viewer">
          <div ref="pdfContainer" class="pdf-container"></div>
          <div class="pdf-controls">
            <van-button size="mini" @click="prevPage" :disabled="currentPage <= 1">上一页</van-button>
            <span class="page-info">{{ currentPage }} / {{ totalPages }}</span>
            <van-button size="mini" @click="nextPage" :disabled="currentPage >= totalPages">下一页</van-button>
          </div>
        </div>

        <!-- DOCX预览 -->
        <div v-else-if="props.format === 'docx'" class="docx-viewer">
          <div ref="docxContainer" class="docx-container" v-html="docxContent"></div>
        </div>

        <!-- TXT预览 -->
        <div v-else-if="props.format === 'txt'" class="txt-viewer">
          <pre class="txt-content">{{ txtContent }}</pre>
        </div>

        <!-- 不支持的格式 -->
        <div v-else class="document-placeholder">
          <div class="doc-icon">{{ formatIcon }}</div>
          <div class="doc-name">{{ title }}</div>
          <div class="doc-message">暂不支持此格式的预览</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, computed, watch, onMounted } from 'vue';
import * as pdfjs from 'pdfjs-dist';
import * as mammoth from 'mammoth';

// 设置PDF.js工作路径
pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';

const props = defineProps({
  src: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  format: {
    type: String,
    required: true,
    validator: (value) => ['pdf', 'docx', 'txt'].includes(value)
  }
});

const isOpen = ref(false);
const loading = ref(false);
const pdfContainer = ref(null);
const docxContainer = ref(null);
const txtContent = ref('');
const docxContent = ref('');
const pdfDoc = ref(null);
const currentPage = ref(1);
const totalPages = ref(0);

const toggleDocument = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    loadDocument();
  }
};

const loadDocument = async () => {
  loading.value = true;
  
  try {
    if (props.format === 'pdf') {
      await loadPdf();
    } else if (props.format === 'docx') {
      await loadDocx();
    } else if (props.format === 'txt') {
      await loadTxt();
    }
  } catch (error) {
    console.error('加载文档失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadPdf = async () => {
  try {
    // 加载PDF文档
    const loadingTask = pdfjs.getDocument(props.src);
    pdfDoc.value = await loadingTask.promise;
    totalPages.value = pdfDoc.value.numPages;
    currentPage.value = 1;
    
    // 渲染第一页
    renderPdfPage(currentPage.value);
  } catch (error) {
    console.error('PDF加载失败:', error);
  }
};

const renderPdfPage = async (pageNumber) => {
  if (!pdfDoc.value) return;
  
  try {
    const page = await pdfDoc.value.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1.5 });
    
    // 准备canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    // 清除容器
    if (pdfContainer.value) {
      pdfContainer.value.innerHTML = '';
      pdfContainer.value.appendChild(canvas);
    }
    
    // 渲染PDF页面到canvas
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
  } catch (error) {
    console.error('渲染PDF页面失败:', error);
  }
};

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    renderPdfPage(currentPage.value);
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    renderPdfPage(currentPage.value);
  }
};

const loadDocx = async () => {
  try {
    // 获取DOCX文件的ArrayBuffer
    const response = await fetch(props.src);
    const arrayBuffer = await response.arrayBuffer();
    
    // 使用mammoth将DOCX转换为HTML
    const result = await mammoth.convertToHtml({ arrayBuffer });
    docxContent.value = result.value;
  } catch (error) {
    console.error('DOCX加载失败:', error);
    docxContent.value = '<div class="error">文档加载失败</div>';
  }
};

const loadTxt = async () => {
  try {
    // 获取TXT文件内容
    const response = await fetch(props.src);
    txtContent.value = await response.text();
  } catch (error) {
    console.error('TXT加载失败:', error);
    txtContent.value = '文档加载失败';
  }
};

const formatLabel = computed(() => {
  const formats = {
    pdf: 'PDF文档',
    docx: 'Word文档',
    txt: '文本文件'
  };
  return formats[props.format] || '文档';
});

const formatIcon = computed(() => {
  const icons = {
    pdf: '📄',
    docx: '📝',
    txt: '📃'
  };
  return icons[props.format] || '📄';
});

// 监听文档源变化
watch(() => props.src, () => {
  if (isOpen.value) {
    loadDocument();
  }
});
</script>

<style scoped>
.document-viewer {
  background-color: white;
  border-radius: 8px;
  padding: 12px;
  margin: 16px 0;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 1px solid var(--border-color);
}

.document-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.document-title {
  font-size: 14px;
  font-weight: bold;
  color: var(--accent-color);
}

.document-format {
  font-size: 12px;
  color: #999;
  background-color: #f5f5f5;
  padding: 2px 6px;
  border-radius: 4px;
}

.document-preview {
  margin-top: 12px;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  overflow: hidden;
}

.document-frame {
  background-color: #f9f9f9;
  min-height: 200px;
}

.document-placeholder {
  text-align: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.doc-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.doc-name {
  font-weight: bold;
  margin-bottom: 8px;
}

.doc-message {
  color: #999;
  font-size: 14px;
}

/* PDF 预览样式 */
.pdf-viewer {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.pdf-container {
  width: 100%;
  overflow: auto;
  display: flex;
  justify-content: center;
}

.pdf-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 16px;
  gap: 10px;
}

.page-info {
  margin: 0 8px;
  font-size: 14px;
  color: #666;
}

/* DOCX 预览样式 */
.docx-viewer {
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.docx-container {
  background-color: white;
  padding: 20px;
  border-radius: 4px;
  font-family: 'Arial', sans-serif;
  line-height: 1.5;
}

/* TXT 预览样式 */
.txt-viewer {
  padding: 16px;
  max-height: 600px;
  overflow-y: auto;
}

.txt-content {
  font-family: monospace;
  white-space: pre-wrap;
  background-color: white;
  padding: 16px;
  margin: 0;
  border-radius: 4px;
  font-size: 14px;
  line-height: 1.5;
}
</style>