import { defineStore } from 'pinia';
import { showToast, showLoadingToast, closeToast } from 'vant';

/**
 * API 服务模块
 * 集中管理所有API调用，提供统一的接口
 */
const apiService = {
  // API状态
  isLoaded: false,
  initialized: false,
  apiModules: {},
  initPromise: null,
  
  // 调试级别: 0-无日志, 1-错误, 2-警告, 3-信息, 4-调试, 5-详细
  debugLevel: 4,

  // 初始化API服务 (返回Promise以便等待完成)
  async init() {
    // 如果已经初始化中，返回现有的初始化Promise
    if (this.initPromise) {
      return this.initPromise;
    }
    
    // 创建并存储初始化Promise
    this.initPromise = new Promise(async (resolve, reject) => {
      try {
        this._log('开始初始化API服务...', 3);
        
        // 加载 uniqueCodeApi.js 模块
        const uniqueCodeApi = await import('../api/uniqueCodeApi.js').catch(err => {
          this._log('无法加载 uniqueCodeApi 模块:', err, 2);
          // 创建一个备用模块，提供基本功能
          return {
            getBookDataByChapterId: async (chapterId) => {
              this._log('使用模拟的 getBookDataByChapterId 函数', 2);
              return {
                id: 1,
                title: '模拟书籍',
                author: '模拟作者',
                category: '小说',
                description: '这是一本模拟的书籍，用于API调用失败时显示',
                publishDate: '2023-01-01',
                currentChapter: {
                  title: '模拟章节',
                  totalPages: 1,
                  pages: [[{ type: 'text', data: '<p>这是模拟章节内容</p>' }]]
                },
                chapters: []
              };
            }
          };
        });
        
        // 加载 bookApi.js 模块
        const bookApi = await import('../api/bookApi.js').catch(err => {
          this._log('无法加载 bookApi 模块:', err, 2);
          // 创建一个备用模块，提供基本功能
          return {
            getBookChapters: async (uniqueCodeId) => {
              this._log('使用模拟的 getBookChapters 函数', 2);
              return {
                bookInfo: {
                  bookId: 1,
                  bookName: '模拟书籍',
                  bookAuthor: '模拟作者',
                  bookTypeName: '小说',
                  bookDescribe: '这是一本模拟的书籍，用于API调用失败时显示',
                  createTime: new Date().getTime()
                },
                chapters: [
                  { id: 'chapter-1', title: '第一章：开始' },
                  { id: 'chapter-2', title: '第二章：发展' },
                  { id: 'chapter-3', title: '第三章：高潮' },
                  { id: 'chapter-4', title: '第四章：结局' }
                ]
              };
            },
            transformChapterData: (data) => {
              this._log('使用模拟的 transformChapterData 函数', 2);
              // 如果数据已经符合格式，直接返回
              if (data && data.pages && Array.isArray(data.pages)) {
                return data;
              }
              
              // 否则创建基本结构
              return {
                id: data?.id || 0,
                title: data?.title || '模拟章节',
                totalPages: 1,
                pages: [[{ type: 'text', data: '<p>模拟章节内容</p>' }]]
              };
            }
          };
        });
        
        // 存储API模块引用
        this.apiModules = {
          uniqueCodeApi: uniqueCodeApi,
          bookApi: bookApi
        };
        
        // 记录可用API函数
        this._logAvailableApis();
        
        // 标记为已加载
        this.isLoaded = true;
        this.initialized = true;
        this._log('API模块加载成功', 3);
        
        // 延迟一小段时间以确保模块完全初始化
        await new Promise(r => setTimeout(r, 300));
        
        resolve(true);
      } catch (error) {
        this._log('初始化API服务失败:', error, 1);
        this.isLoaded = false;
        this.initialized = true; // 即使失败也标记为已初始化，以避免无限循环
        reject(error);
      }
    });
    
    return this.initPromise;
  },

  // 确保API已初始化
  async ensureInitialized() {
    if (this.initialized) {
      return true;
    }
    
    try {
      await this.init();
      return true;
    } catch (error) {
      this._log('确保API初始化失败:', error, 1);
      return false;
    }
  },

  // 记录可用的API函数，便于调试
  _logAvailableApis() {
    const apis = {
      uniqueCodeApi: this.apiModules.uniqueCodeApi ? Object.keys(this.apiModules.uniqueCodeApi) : [],
      bookApi: this.apiModules.bookApi ? Object.keys(this.apiModules.bookApi) : []
    };
    
    this._log('可用API函数:', apis, 4);
    
    // 检查预期的函数是否存在
    const uniqueCodeApi = this.apiModules.uniqueCodeApi || {};
    const bookApi = this.apiModules.bookApi || {};
    
    this._log('API函数检查:', {
      'getBookDataByChapterId (selectUniqueCodeById)': typeof uniqueCodeApi.getBookDataByChapterId === 'function',
      'getBookChapters (selectBookCatalogById)': typeof bookApi.getBookChapters === 'function',
      'transformChapterData': typeof bookApi.transformChapterData === 'function'
    }, 4);
  },

  // 获取书籍目录信息 (uniqueCode/manage/selectBookCatalogById)
  // BookList.vue 使用此方法获取书籍和章节列表
  async getBookCatalog(uniqueCodeId) {
    // 确保API已初始化
    await this.ensureInitialized();
    
    try {
      const api = this.apiModules.bookApi;
      
      // 检查API模块和函数是否存在
      if (!api) {
        this._log('API模块不可用: bookApi', 2);
        throw new Error('API模块不可用: bookApi');
      }
      
      // 检查是否存在getBookChapters函数 (对应selectBookCatalogById接口)
      if (typeof api.getBookChapters !== 'function') {
        this._log('API函数不可用: getBookChapters (selectBookCatalogById)', 2);
        throw new Error('API不可用: selectBookCatalogById');
      }
      
      // 调用API函数获取书籍目录数据
      const result = await api.getBookChapters(uniqueCodeId);
      this._log('API返回的书籍目录数据:', result, 4);
      
      // 检查结果
      if (!result) {
        throw new Error('获取书籍目录信息返回空结果');
      }
      
      return result;
    } catch (error) {
      this._log('获取书籍目录信息失败:', error, 1);
      throw error;
    }
  },

  // 获取书籍详情信息 (uniqueCode/manage/selectUniqueCodeById)
  // BookDetail.vue 使用此方法获取书籍详情和章节内容
  async getBookDetail(chapterId) {
    // 确保API已初始化
    await this.ensureInitialized();
    
    try {
      const api = this.apiModules.uniqueCodeApi;
      
      // 检查API模块和函数是否存在
      if (!api) {
        this._log('API模块不可用: uniqueCodeApi', 2);
        throw new Error('API模块不可用: uniqueCodeApi');
      }
      
      // 检查是否存在getBookDataByChapterId函数
      if (typeof api.getBookDataByChapterId !== 'function') {
        this._log('API函数不可用: getBookDataByChapterId (selectUniqueCodeById)', 2);
        throw new Error('API不可用: selectUniqueCodeById');
      }
      
      // 调用API函数，使用chapterId而不是uniqueCodeId
      const result = await api.getBookDataByChapterId(chapterId);
      
      // 检查结果
      if (!result) {
        throw new Error('获取书籍详情信息返回空结果');
      }
      
      return result;
    } catch (error) {
      this._log('获取书籍详情信息失败:', error, 1);
      throw error;
    }
  },

  // 转换章节数据
  transformChapterData(data) {
    try {
      if (!data) return null;
      
      const api = this.apiModules.bookApi;
      
      // 检查转换函数是否存在
      if (api && typeof api.transformChapterData === 'function') {
        return api.transformChapterData(data);
      }
      
      // 如果转换函数不存在，返回默认格式
      this._log('transformChapterData 函数不可用，使用默认转换', 2);
      return {
        title: data.title || '未知章节',
        totalPages: 1,
        pages: [[{ type: 'text', data: data.content || data.codeContent || '暂无内容' }]]
      };
    } catch (error) {
      this._log('转换章节数据失败:', error, 1);
      // 返回默认数据
      return {
        title: '转换失败的章节',
        totalPages: 1,
        pages: [[{ type: 'text', data: '<p>章节数据转换失败，请稍后重试</p>' }]]
      };
    }
  },

  /**
   * 处理富文本内容，进行分页和类型识别
   * @param {string} content - UEditor生成的HTML内容
   * @param {Object} options - 配置选项
   * @returns {Array} 分页后的内容数组
   */
  processRichTextContent(content, options = {}) {
    const startTime = performance.now();
    this._log('开始处理富文本内容...', 3);
    this._log('原始HTML内容长度: ' + (content?.length || 0) + ' 字符', 4);
    
    try {
      if (!content) {
        this._log('内容为空，返回默认页面', 2);
        return [[{ type: 'text', data: '<p>暂无内容</p>' }]];
      }

      // 合并用户配置与默认配置
      const config = {
        // 分页配置
        targetPageSize: 300,          // 目标每页字符数上限
        maxImagesPerPage: 2,           // 每页最大图片数量
        maxMediaPerPage: 1,            // 每页最大媒体数量(视频、音频)
        maxParagraphsPerPage: 5,      // 每页最大段落数
        minParagraphsPerPage: 1,       // 每页最小段落数
        preferCompleteElements: true,  // 尽量保持元素完整性
        respectHeadings: true,         // 尊重标题元素的分页
        
        // 媒体元素权重设置 
        textWeight: 1,                 // 文本权重(每字符)
        imageWeight: 500,              // 图片权重
        videoWeight: 900,              // 视频权重
        audioWeight: 400,              // 音频权重
        documentWeight: 300,           // 附件权重
        
        // 类型识别配置
        imageExts: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'],
        videoExts: ['mp4', 'webm', 'ogg', 'mov', 'm4v', 'avi', 'wmv'],
        audioExts: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'],
        documentExts: {
          'pdf': 'pdf',
          'doc': 'docx', 'docx': 'docx',
          'xls': 'xlsx', 'xlsx': 'xlsx',
          'ppt': 'pptx', 'pptx': 'pptx',
          'txt': 'txt'
        },
        
        ...options
      };
      
      this._log('使用配置:', config, 4);

      // 创建临时DOM解析内容
      this._log('开始解析DOM...');
      const parser = new DOMParser();
      const doc = parser.parseFromString(this._sanitizeHtml(content), 'text/html');
      
      // 获取并处理所有顶级元素
      this._log('提取DOM元素...');
      const elements = Array.from(doc.body.children);
      this._log(`找到 ${elements.length} 个顶级元素`, 3);
      
      // 解析和提取内容元素
      this._log('开始内容类型识别和处理...');
      const processedElements = this._processElements(elements, config);
      this._log(`处理完成，共 ${processedElements.length} 个内容元素`, 3);
      
      // 调试：输出处理后的元素类型统计
      this._logElementStatistics(processedElements);
      
      // 执行智能分页
      this._log('开始执行智能分页算法...');
      const pages = this._smartPagination(processedElements, config);
      this._log(`分页完成，共分为 ${pages.length} 页`, 3);
      
      // 分页统计
      this._logPaginationStats(pages, processedElements);
      
      const endTime = performance.now();
      this._log(`富文本处理完成，耗时 ${(endTime - startTime).toFixed(2)} ms`, 3);
      
      return pages;
    } catch (error) {
      this._log('处理富文本内容失败:', error, 1);
      return [[{ type: 'text', data: '<p>内容处理失败，请稍后重试</p>' }]];
    }
  },
  
  /**
   * 清理HTML内容，修复常见问题
   * @private
   */
  _sanitizeHtml(html) {
    if (typeof html !== 'string') return '<p>无效内容</p>';
    
    let cleanHtml = html;
    
    // 修复常见的UEditor问题
    
    // 1. 修复没有闭合的段落标签
    cleanHtml = cleanHtml.replace(/<p([^>]*)>([^<]*)/g, (match, attrs, content) => {
      if (!match.includes('</p>')) {
        return `<p${attrs}>${content}</p>`;
      }
      return match;
    });
    
    // 2. 移除空段落
    cleanHtml = cleanHtml.replace(/<p>\s*&nbsp;\s*<\/p>/g, '');
    
    // 3. 处理嵌套在段落中的块级元素 (UEditor常见问题)
    cleanHtml = cleanHtml.replace(/<p([^>]*)>\s*(<div|<table|<h\d|<ul|<ol)/g, '$2');
    cleanHtml = cleanHtml.replace(/(<\/div>|<\/table>|<\/h\d>|<\/ul>|<\/ol>)\s*<\/p>/g, '$1');
    
    // 4. 修复Ueditor插入的不完整的视频和音频标签
    cleanHtml = cleanHtml.replace(/<embed([^>]*)(type="audio\/[^"]*")([^>]*)>/g, 
      '<audio controls><source $1 $3></audio>');
    cleanHtml = cleanHtml.replace(/<embed([^>]*)(type="video\/[^"]*")([^>]*)>/g, 
      '<video controls><source $1 $3></video>');
    
    return cleanHtml;
  },
  
  /**
   * 处理DOM元素集合，识别类型并提取信息
   * @private
   */
  _processElements(elements, config) {
    let processedElements = [];
    
    // 递归处理元素及其子元素
    const processElement = (element, depth = 0) => {
      try {
        // 空元素或注释节点，跳过
        if (!element || element.nodeType === 8) return null;
        
        // 文本节点单独处理
        if (element.nodeType === 3) {
          const text = element.textContent.trim();
          if (text) {
            return {
              type: 'text',
              data: text,
              size: text.length,
              weight: text.length * config.textWeight,
              isBlock: false
            };
          }
          return null;
        }
        
        // 获取当前元素的标签名和类名
        const tagName = element.tagName?.toLowerCase();
        const className = element.className || '';
        
        // 跳过不可见元素
        if (this._isHiddenElement(element)) {
          this._log(`跳过不可见元素: ${tagName}.${className}`, 5);
          return null;
        }
        
        // 处理图片元素
        if (tagName === 'img' || (element.querySelector && element.querySelector('img'))) {
          const img = tagName === 'img' ? element : element.querySelector('img');
          const imgSrc = img.getAttribute('src') || '';
          const imgAlt = img.getAttribute('alt') || '';
          const imgTitle = img.getAttribute('title') || '';
          
          return {
            type: 'image',
            src: imgSrc,
            caption: imgTitle || imgAlt || '',
            data: element.outerHTML || img.outerHTML,
            size: config.imageWeight,
            weight: config.imageWeight,
            isBlock: true
          };
        }
        
        // 处理视频元素
        if (tagName === 'video' || 
            (element.querySelector && (element.querySelector('video') || element.querySelector('embed[type^="video"]')))) {
          const video = tagName === 'video' ? element : (element.querySelector('video') || element.querySelector('embed[type^="video"]'));
          const videoSrc = video.getAttribute('src') || video.querySelector('source')?.getAttribute('src') || '';
          
          return {
            type: 'video',
            src: videoSrc,
            poster: video.getAttribute('poster') || '',
            title: video.getAttribute('title') || element.textContent.trim() || '视频',
            data: element.outerHTML,
            size: config.videoWeight,
            weight: config.videoWeight,
            isBlock: true
          };
        }
        
        // 处理音频元素
        if (tagName === 'audio' || 
            (element.querySelector && (element.querySelector('audio') || element.querySelector('embed[type^="audio"]')))) {
          const audio = tagName === 'audio' ? element : (element.querySelector('audio') || element.querySelector('embed[type^="audio"]'));
          const audioSrc = audio.getAttribute('src') || audio.querySelector('source')?.getAttribute('src') || '';
          
          return {
            type: 'audio',
            src: audioSrc,
            title: audio.getAttribute('title') || element.textContent.trim() || '音频',
            data: element.outerHTML,
            size: config.audioWeight,
            weight: config.audioWeight,
            isBlock: true
          };
        }
        
        // 处理附件链接
        if (tagName === 'a' && element.href) {
          const href = element.getAttribute('href') || '';
          const format = this._getDocumentFormat(href, config);
          
          if (format) {
            return {
              type: 'document',
              src: href,
              title: element.textContent.trim() || '附件',
              format: format,
              data: element.outerHTML,
              size: config.documentWeight,
              weight: config.documentWeight,
              isBlock: false
            };
          }
        }
        
        // 处理标题元素 (h1-h6) - 保持完整性
        if (/^h[1-6]$/.test(tagName)) {
          return {
            type: 'text',
            data: element.outerHTML,
            size: element.textContent.length,
            weight: element.textContent.length * config.textWeight * 2, // 标题权重加倍
            isBlock: true,
            isHeading: true,
            level: parseInt(tagName.substring(1), 10)
          };
        }
        
        // 处理块级元素 (p, div, table, blockquote等)
        if (this._isBlockElement(tagName)) {
          // 如果没有子元素或只有文本节点，则直接处理为文本
          if (element.childNodes.length === 0 || 
             (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3)) {
            
            // 空段落或只有空白字符，可以忽略
            const text = element.textContent.trim();
            if (!text || text === '&nbsp;') {
              return null;
            }
            
            return {
              type: 'text',
              data: element.outerHTML,
              size: text.length,
              weight: text.length * config.textWeight,
              isBlock: true
            };
          }
          
          // 检查是否含有媒体子元素
          const hasMediaChild = element.querySelector('img, video, audio, embed');
          if (hasMediaChild) {
            // 如果含有媒体元素，需要递归处理其子元素
            let childResults = [];
            Array.from(element.childNodes).forEach(child => {
              const result = processElement(child, depth + 1);
              if (result) {
                childResults.push(result);
              }
            });
            
            // 只返回处理后的子元素结果
            return childResults;
          }
          
          // 不含媒体子元素的块级元素，作为一个整体文本处理
          return {
            type: 'text',
            data: element.outerHTML,
            size: element.textContent.length,
            weight: element.textContent.length * config.textWeight,
            isBlock: true
          };
        }
        
        // 递归处理有子元素的容器
        if (element.childNodes && element.childNodes.length > 0) {
          let childResults = [];
          Array.from(element.childNodes).forEach(child => {
            const result = processElement(child, depth + 1);
            if (result) {
              // 如果结果是数组(子元素包含多个结果)，扁平化处理
              if (Array.isArray(result)) {
                childResults = childResults.concat(result);
              } else {
                childResults.push(result);
              }
            }
          });
          
          // 返回所有子元素处理结果
          return childResults.length > 0 ? childResults : null;
        }
        
        // 默认处理为文本节点
        const text = element.textContent.trim();
        if (text) {
          return {
            type: 'text',
            data: element.outerHTML || text,
            size: text.length,
            weight: text.length * config.textWeight,
            isBlock: false
          };
        }
        
        return null;
      } catch (error) {
        this._log(`处理元素错误: ${error.message}`, 1);
        return {
          type: 'text',
          data: element.outerHTML || '<p>内容解析错误</p>',
          size: 100,
          weight: 100,
          isBlock: true
        };
      }
    };
    
    // 处理每个顶级元素
    elements.forEach(element => {
      const result = processElement(element);
      
      if (result) {
        if (Array.isArray(result)) {
          // 扁平化处理结果数组
          processedElements = processedElements.concat(result);
        } else {
          processedElements.push(result);
        }
      }
    });
    
    // 移除null和重复项
    processedElements = processedElements.filter(item => item !== null);
    
    return processedElements;
  },
  
  /**
   * 智能分页算法
   * @private
   */
  _smartPagination(elements, config) {
    if (!elements || elements.length === 0) {
      return [[{ type: 'text', data: '<p>暂无内容</p>' }]];
    }
    
    this._log(`开始分页，共 ${elements.length} 个元素`, 4);
    const { targetPageSize, maxImagesPerPage, maxMediaPerPage, maxParagraphsPerPage, minParagraphsPerPage } = config;
    
    // 预分析步骤：寻找自然段落分界点
    const analyzeBreakPoints = () => {
      let breakPoints = [];
      let currentWeight = 0;
      let currentMediaCount = 0;
      let currentImageCount = 0;
      let currentParagraphCount = 0;
      
      elements.forEach((element, index) => {
        // 计数器递增
        currentWeight += element.weight || 0;
        if (element.type === 'image') currentImageCount++;
        if (element.type === 'video' || element.type === 'audio') currentMediaCount++;
        if (element.isBlock) currentParagraphCount++;
        
        // 记录潜在的分页点
        const breakScore = this._calculateBreakScore(currentWeight, targetPageSize, 
                                                    currentImageCount, maxImagesPerPage,
                                                    currentMediaCount, maxMediaPerPage,
                                                    currentParagraphCount, maxParagraphsPerPage);
        
        breakPoints.push({
          index,
          score: breakScore,
          weight: currentWeight,
          imageCount: currentImageCount,
          mediaCount: currentMediaCount,
          paragraphCount: currentParagraphCount,
          // 额外因素
          isBlockEnd: element.isBlock,
          isHeading: element.isHeading
        });
      });
      
      return breakPoints;
    };
    
    // 计算最佳分页位置
    const findOptimalBreakPoints = (breakPoints) => {
      let optimalBreaks = [];
      let currentPageStart = 0;
      
      while (currentPageStart < elements.length) {
        // 筛选当前页面的有效分页点
        const validBreaks = breakPoints
          .filter(bp => bp.index >= currentPageStart && 
                          bp.paragraphCount >= minParagraphsPerPage)
          .map(bp => ({
            ...bp,
            // 调整权重，计算当前页面相对的权重
            relativeWeight: bp.weight - (breakPoints[currentPageStart]?.weight || 0),
            relativeImageCount: bp.imageCount - (breakPoints[currentPageStart]?.imageCount || 0),
            relativeMediaCount: bp.mediaCount - (breakPoints[currentPageStart]?.mediaCount || 0)
          }));
        
        if (validBreaks.length === 0) {
          // 如果没有有效分页点，直接将剩余内容放入一页
          optimalBreaks.push(elements.length - 1);
          break;
        }
        
        // 寻找权重接近但不超过目标权重的位置
        const optimalBreak = this._findOptimalBreakPoint(validBreaks, config);
        
        if (optimalBreak) {
          optimalBreaks.push(optimalBreak.index);
          currentPageStart = optimalBreak.index + 1;
        } else {
          // 如果找不到最佳分页点，取最后一个元素位置
          optimalBreaks.push(elements.length - 1);
          break;
        }
      }
      
      return optimalBreaks;
    };
    
    // 根据最佳分页点创建页面
    const createPages = (breakPoints) => {
      const pages = [];
      let startIndex = 0;
      
      breakPoints.forEach(breakIndex => {
        const pageElements = elements.slice(startIndex, breakIndex + 1).map(element => ({
          type: element.type,
          ...(element.type === 'text' ? { data: element.data } : {}),
          ...(element.type === 'image' ? { src: element.src, caption: element.caption } : {}),
          ...(element.type === 'video' ? { src: element.src, poster: element.poster, title: element.title } : {}),
          ...(element.type === 'audio' ? { src: element.src, title: element.title } : {}),
          ...(element.type === 'document' ? { src: element.src, title: element.title, format: element.format } : {})
        }));
        
        pages.push(pageElements);
        startIndex = breakIndex + 1;
      });
      
      return pages;
    };
    
    // 执行分页流程
    const breakPoints = analyzeBreakPoints();
    this._log('分析的断点:', breakPoints, 5);
    
    const optimalBreaks = findOptimalBreakPoints(breakPoints);
    this._log('最优分页位置:', optimalBreaks, 4);
    
    const pages = createPages(optimalBreaks);
    
    return pages;
  },
  
  /**
   * 计算分页得分
   * @private
   */
  _calculateBreakScore(weight, targetWeight, imageCount, maxImages, mediaCount, maxMedia, paragraphCount, maxParagraphs) {
    // 基础分值 - 权重接近目标值但不超过为佳
    let score = 0;
    
    // 权重评分 (越接近目标权重但不超过，分数越高)
    if (weight <= targetWeight) {
      score += 50 * (weight / targetWeight); // 权重比例得分
    } else {
      score -= 50 * ((weight - targetWeight) / targetWeight); // 超出惩罚
    }
    
    // 图片数量评分
    if (imageCount <= maxImages) {
      score += 10;
    } else {
      score -= 30 * (imageCount - maxImages); // 图片超额较大惩罚
    }
    
    // 媒体数量评分
    if (mediaCount <= maxMedia) {
      score += 10;
    } else {
      score -= 40 * (mediaCount - maxMedia); // 媒体超额更大惩罚
    }
    
    // 段落数量评分
    if (paragraphCount <= maxParagraphs) {
      score += 5 * (paragraphCount / maxParagraphs);
    } else {
      score -= 10 * ((paragraphCount - maxParagraphs) / maxParagraphs);
    }
    
    return score;
  },
  
  /**
   * 查找最佳分页点
   * @private
   */
  _findOptimalBreakPoint(breakPoints, config) {
    if (breakPoints.length === 0) return null;
    
    // 先按照自然分割点分类
    const naturalBreaks = breakPoints.filter(bp => 
      (bp.isBlockEnd && bp.relativeWeight >= config.targetPageSize * 0.3) || // 权重至少有30%
      (bp.isHeading && bp.index > 0 && bp.relativeWeight >= config.targetPageSize * 0.2) // 标题前允许更低的权重
    );
    
    // 如果有自然分割点，优先考虑
    if (naturalBreaks.length > 0) {
      // 在自然分割点中找最接近目标权重的
      const optimalNaturalBreak = naturalBreaks.reduce((best, current) => {
        // 如果当前点权重接近目标且不超过太多
        if (current.relativeWeight <= config.targetPageSize * 1.2 && 
            (best === null || Math.abs(current.relativeWeight - config.targetPageSize) < Math.abs(best.relativeWeight - config.targetPageSize))) {
          return current;
        }
        return best;
      }, null);
      
      if (optimalNaturalBreak) {
        return optimalNaturalBreak;
      }
    }
    
    // 如果没有合适的自然分割点，则在所有点中寻找最佳点
    const candidateBreaks = breakPoints.filter(bp => 
      bp.relativeWeight >= config.targetPageSize * 0.5 && // 至少要有一半权重
      bp.relativeWeight <= config.targetPageSize * 1.3    // 不能超过太多
    );
    
    if (candidateBreaks.length > 0) {
      // 按照分数降序排序，取最高分
      return candidateBreaks.sort((a, b) => {
        const scoreA = this._calculateBreakScore(
          a.relativeWeight, config.targetPageSize,
          a.relativeImageCount, config.maxImagesPerPage,
          a.relativeMediaCount, config.maxMediaPerPage,
          a.paragraphCount, config.maxParagraphsPerPage
        );
        
        const scoreB = this._calculateBreakScore(
          b.relativeWeight, config.targetPageSize,
          b.relativeImageCount, config.maxImagesPerPage,
          b.relativeMediaCount, config.maxMediaPerPage,
          b.paragraphCount, config.maxParagraphsPerPage
        );
        
        return scoreB - scoreA;
      })[0];
    }
    
    // 如果还是没有找到合适的分页点，就取最后一个有效的分页点
    return breakPoints[breakPoints.length - 1];
  },
  
  /**
   * 判断链接是否为文档附件
   * @private
   */
  _getDocumentFormat(href, config) {
    if (!href) return null;
    
    // 提取文件扩展名
    const match = href.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
    if (!match) return null;
    
    const ext = match[1].toLowerCase();
    return config.documentExts[ext] || null;
  },
  
  /**
   * 检查元素是否为块级元素
   * @private
   */
  _isBlockElement(tagName) {
    const blockElements = [
      'div', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li', 'blockquote', 'table', 'tr', 'section', 
      'article', 'header', 'footer', 'nav', 'aside', 'form',
      'fieldset', 'figure', 'figcaption', 'address'
    ];
    return blockElements.includes(tagName);
  },
  
  /**
   * 检查元素是否隐藏
   * @private
   */
  _isHiddenElement(element) {
    if (!element || !element.style) return false;
    
    return element.style.display === 'none' || 
           element.style.visibility === 'hidden' ||
           element.hidden === true;
  },
  
  /**
   * 记录元素统计信息
   * @private
   */
  _logElementStatistics(elements) {
    if (this.debugLevel < 3) return;
    
    const stats = {
      total: elements.length,
      types: {}
    };
    
    elements.forEach(el => {
      if (!stats.types[el.type]) {
        stats.types[el.type] = 0;
      }
      stats.types[el.type]++;
    });
    
    this._log('内容元素统计:', stats, 3);
  },
  
  /**
   * 记录分页统计信息
   * @private
   */
  _logPaginationStats(pages, elements) {
    if (this.debugLevel < 3) return;
    
    const stats = {
      totalPages: pages.length,
      totalElements: elements.length,
      averageElementsPerPage: Math.round(elements.length / pages.length),
      pages: []
    };
    
    pages.forEach((page, index) => {
      const pageStats = {
        pageNumber: index + 1,
        elements: page.length,
        types: {}
      };
      
      page.forEach(el => {
        if (!pageStats.types[el.type]) {
          pageStats.types[el.type] = 0;
        }
        pageStats.types[el.type]++;
      });
      
      stats.pages.push(pageStats);
    });
    
    this._log('分页统计:', stats, 3);
  },
  
  /**
   * 辅助日志函数
   * @private
   */
  _log(message, data, level = 3) {
    // 根据调试级别决定是否打印日志
    if (level > this.debugLevel) return;
    
    if (level === 1) {
      // 错误
      console.error(`[BookStore] ${message}`, data);
    } else if (level === 2) {
      // 警告
      console.warn(`[BookStore] ${message}`, data);
    } else if (level === 5) {
      // 详细
      console.debug(`[BookStore] ${message}`, data);
    } else {
      // 信息
      console.log(`[BookStore] ${message}`, data);
    }
  }
};

// 预初始化API服务
apiService.init().catch(error => {
  console.error('API服务初始化失败，应用可能无法正常工作:', error);
});

export const useBookStore = defineStore('book', {
  state: () => ({
    book: null,
    currentChapter: null,
    currentPage: 0,
    
    // 加载状态
    loading: false,
    error: null,
    apiInitializing: false,
    retryCount: 0,
    
    // 音频相关状态
    isAudioPlaying: false,
    currentAudioSrc: '',
    audioProgress: 0,
    
    // 语音朗读状态
    isVoiceReading: false,
    selectedTextContent: '',
    
    // 文档查看状态
    currentDocument: null,
    
    // 界面状态
    showImageViewer: false,
    currentImage: null,
    showDocumentViewer: false,
    
    // 环境配置 - 这里将存储由 uniqueCodeApi.js 提取后的ID
    uniqueCodeId: 'fe309332-bb98-4c6b-8eaa-3458b09856f4', 
    
    // 分页配置
    paginationOptions: {
      targetPageSize: 300,        // 目标每页字符数上限
      maxImagesPerPage: 2,         // 每页最大图片数
      maxMediaPerPage: 1,          // 每页最大媒体数(视频/音频)
      maxParagraphsPerPage: 5,    // 每页最大段落数
      minParagraphsPerPage: 1,     // 每页最小段落数
      preferCompleteElements: true, // 尽量保持元素完整性
      respectHeadings: true,       // 尊重标题元素的分页
    }
  }),
  
  getters: {
    totalPages() {
      return this.currentChapter?.totalPages || 1;
    },
    
    currentPageContent() {
      if (!this.currentChapter || !this.currentChapter.pages) return [];
      return this.currentChapter.pages[this.currentPage] || [];
    },
    
    chapterTitle() {
      return this.currentChapter?.title || '';
    },
    
    isLoading() {
      return this.loading || this.apiInitializing;
    },
    
    hasError() {
      return !!this.error;
    }
  },
  
  actions: {
    /**
     * 确保API已初始化
     * @returns {Promise<boolean>} 是否成功初始化
     */
    async ensureApiInitialized() {
      // 如果已经在初始化中，等待完成
      if (this.apiInitializing) {
        try {
          await apiService.initPromise;
          this.apiInitializing = false;
          return true;
        } catch (error) {
          this.apiInitializing = false;
          return false;
        }
      }
      
      // 如果已经初始化，直接返回成功
      if (apiService.initialized) {
        return true;
      }
      
      // 开始初始化
      this.apiInitializing = true;
      
      try {
        await apiService.init();
        this.apiInitializing = false;
        return true;
      } catch (error) {
        console.error('API初始化失败:', error);
        this.apiInitializing = false;
        return false;
      }
    },
    
    /**
     * 初始化书籍数据 - BookList.vue 使用此方法
     * 调用 uniqueCode/manage/selectBookCatalogById 获取书籍目录和章节列表
     */
    async initBookData() {
      this.loading = true;
      this.error = null;
      
      try {
        // 显示加载提示
        showLoadingToast({
          message: '加载数据中...',
          forbidClick: true,
          duration: 0
        });
        
        // 确保API已初始化
        const initialized = await this.ensureApiInitialized();
        if (!initialized) {
          throw new Error('API初始化失败，请稍后重试');
        }
        
        // 获取书籍目录信息，直接使用已经由uniqueCodeApi.js解析后的uniqueCodeId
        const bookData = await apiService.getBookCatalog(this.uniqueCodeId);
        console.log("获取的书籍数据:", bookData);
        
        // 如果返回了组合对象（包含bookInfo和chapters）
        if (bookData && bookData.bookInfo) {
          // 设置书籍信息
          this.book = {
            id: bookData.bookInfo.bookId,
            title: bookData.bookInfo.bookName || '未知书名',
            author: bookData.bookInfo.bookAuthor || '未知作者',
            category: bookData.bookInfo.bookTypeName || '分类',
            description: bookData.bookInfo.bookDescribe || '描述',
            cover: bookData.bookInfo.banner || '',
            publishDate: bookData.bookInfo.createTime || '',
            // 设置章节列表
            chapters: bookData.chapters || []
          };
        } else {
          // 创建基本书籍信息
          this.book = {
            title: '书籍名称',
            author: '作者',
            category: '分类',
            description: '描述',
            chapters: []
          };
        }
        
        // 重置重试计数
        this.retryCount = 0;
        
        // 关闭加载提示
        closeToast();
        
        console.log("成功获取书籍目录数据:", this.book);
        
        // 如果没有章节，显示提示
        if (!this.book.chapters || this.book.chapters.length === 0) {
          showToast({
            message: '该书籍暂无章节内容',
            position: 'top'
          });
        }
      } catch (error) {
        // 记录错误
        console.error('初始化书籍数据失败:', error);
        this.error = error.message || '加载书籍数据失败';
        
        // 关闭加载提示
        closeToast();
        
        // 显示错误提示
        showToast({
          message: `加载失败: ${this.error}`,
          position: 'top',
          type: 'fail'
        });
        
        // 重试次数增加
        this.retryCount++;
        
        // 如果重试次数小于3，自动重试
        if (this.retryCount < 3) {
          showToast({
            message: `正在重试 (${this.retryCount}/3)...`,
            position: 'top'
          });
          
          // 延迟1秒后重试
          setTimeout(() => {
            this.initBookData();
          }, 1000);
        }
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 加载章节内容 - BookDetail.vue 使用此方法
     * 调用 uniqueCode/manage/selectUniqueCodeById 获取书籍详情和章节内容
     * @param {string} chapterId - 章节ID
     */
    async loadChapter(chapterId) {
      const startTime = performance.now();
      console.log(`[BookStore] 开始加载章节 ${chapterId}`);
      
      this.loading = true;
      this.error = null;
      this.currentPage = 0;
      this.stopAllMedia();
      
      try {
        // 显示加载提示
        showLoadingToast({
          message: '加载章节内容...',
          forbidClick: true,
          duration: 0
        });
        
        // 确保API已初始化
        const initialized = await this.ensureApiInitialized();
        if (!initialized) {
          throw new Error('API初始化失败，请稍后重试');
        }
        
        // 检验章节ID的有效性
        if (!chapterId || typeof chapterId !== 'string' || chapterId.trim() === '') {
          throw new Error('无效的章节ID');
        }
        
        console.log(`正在加载章节，chapterId: ${chapterId}`);
        
        // 直接使用chapterId获取书籍详情和章节内容
        // 这里调用API时不需要处理ID，因为 uniqueCodeApi.js 会负责ID提取
        console.log(`获取书籍详情，使用 chapterId: ${chapterId}`);
        const bookDetail = await apiService.getBookDetail(chapterId);
        
        if (bookDetail) {
          console.log(`[BookStore] 成功获取章节数据，开始处理内容`, bookDetail);
          
          // 保留原有的uniqueCodeId
          const currentUniqueCodeId = this.uniqueCodeId;
          
          // 更新书籍详情
          this.book = bookDetail;
          
          // 确保保留原有的uniqueCodeId
          this.uniqueCodeId = currentUniqueCodeId;
          
          console.log('成功获取书籍详情:', this.book);
          console.log('保留的uniqueCodeId:', this.uniqueCodeId);
          
          // 处理富文本内容
          const content = bookDetail.content || '<p>暂无内容</p>';
          console.log(`[BookStore] 开始处理富文本内容，字符数: ${content.length}`);
          
          // 使用增强的富文本处理函数进行内容分页
          const contentProcessingStart = performance.now();
          const pages = apiService.processRichTextContent(content, this.paginationOptions);
          const contentProcessingEnd = performance.now();
          
          console.log(`[BookStore] 富文本内容处理完成，耗时: ${(contentProcessingEnd - contentProcessingStart).toFixed(2)}ms`);
          console.log(`[BookStore] 分页结果: 共 ${pages.length} 页`, pages);
          
          // 创建章节对象
          this.currentChapter = {
            title: bookDetail.title || '章节内容',
            totalPages: pages.length,
            pages: pages
          };
          
          console.log('使用自动处理的章节内容:', {
            title: this.currentChapter.title,
            totalPages: this.currentChapter.totalPages,
            pagesContentSummary: this.currentChapter.pages.map((page, idx) => {
              return {
                pageIndex: idx,
                elementsCount: page.length,
                elementTypes: page.reduce((types, item) => {
                  types[item.type] = (types[item.type] || 0) + 1;
                  return types;
                }, {})
              };
            })
          });
        } else {
          throw new Error('获取书籍详情失败');
        }
        
        // 关闭加载提示
        closeToast();
        
        const endTime = performance.now();
        console.log(`[BookStore] 章节加载和处理完成，总耗时: ${(endTime - startTime).toFixed(2)}ms`);
      } catch (error) {
        console.error('加载章节内容失败:', error);
        this.error = error.message || '加载章节内容失败';
        
        // 关闭加载提示
        closeToast();
        
        // 创建一个空的章节对象
        this.currentChapter = {
          title: '加载失败',
          totalPages: 1,
          pages: [[{ type: 'text', data: `<p>加载章节内容时出错: ${error.message || '未知错误'}，请稍后重试</p>` }]]
        };
        
        // 显示错误提示
        showToast({
          message: `加载章节失败: ${error.message || '未知错误'}`,
          position: 'top',
          type: 'fail'
        });
        
        const endTime = performance.now();
        console.log(`[BookStore] 章节加载失败，耗时: ${(endTime - startTime).toFixed(2)}ms`);
      } finally {
        this.loading = false;
      }
    },

    /**
     * 设置当前章节
     * @param {Object|null} chapter - 章节对象，如果为null则清除当前章节
     */
    setCurrentChapter(chapter) {
      if (chapter) {
        // 直接设置章节对象
        this.currentChapter = chapter;
        this.currentPage = 0;
        this.stopAllMedia();
      } else {
        // 清除当前章节
        this.currentChapter = null;
      }
    },
    
    /**
     * 翻到下一页
     * @returns {boolean} 是否成功翻页
     */
    nextPage() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        return true;
      }
      return false;
    },
    
    /**
     * 翻到上一页
     * @returns {boolean} 是否成功翻页
     */
    prevPage() {
      if (this.currentPage > 0) {
        this.currentPage--;
        return true;
      }
      return false;
    },
    
    /**
     * 切换音频播放状态
     * @param {string} audioSrc - 音频资源URL
     */
    toggleAudio(audioSrc) {
      if (this.currentAudioSrc === audioSrc && this.isAudioPlaying) {
        this.isAudioPlaying = false;
      } else {
        if (this.isVoiceReading) {
          this.stopVoiceReading();
        }
        this.currentAudioSrc = audioSrc;
        this.isAudioPlaying = true;
      }
    },
    
    /**
     * 停止音频播放
     */
    stopAudio() {
      this.isAudioPlaying = false;
    },
    
    /**
     * 更新音频播放进度
     * @param {number} progress - 播放进度百分比(0-100)
     */
    updateAudioProgress(progress) {
      this.audioProgress = progress;
    },
    
    /**
     * 开始语音朗读
     * @param {string} text - 要朗读的文本内容
     */
    startVoiceReading(text) {
      this.stopAudio();
      this.selectedTextContent = text || '';
      this.isVoiceReading = true;
    },
    
    /**
     * 停止语音朗读
     */
    stopVoiceReading() {
      this.isVoiceReading = false;
    },
    
    /**
     * 设置选中的文本内容
     * @param {string} text - 选中的文本
     */
    setSelectedText(text) {
      this.selectedTextContent = text;
    },
    
    /**
     * 停止所有媒体播放
     */
    stopAllMedia() {
      this.stopAudio();
      this.stopVoiceReading();
    },
    
    /**
     * 显示图片查看器
     * @param {string} imageUrl - 图片URL
     */
    showImage(imageUrl) {
      this.currentImage = imageUrl;
      this.showImageViewer = true;
    },
    
    /**
     * 关闭图片查看器
     */
    closeImageViewer() {
      this.showImageViewer = false;
    },
    
    /**
     * 显示文档查看器
     * @param {Object} document - 文档对象
     */
    showDocument(document) {
      this.currentDocument = document;
      this.showDocumentViewer = true;
    },
    
    /**
     * 关闭文档查看器
     */
    closeDocumentViewer() {
      this.showDocumentViewer = false;
    },
    
    /**
     * 设置唯一码ID并重新加载数据
     * 直接设置由外部处理后的ID，不在此处进行提取
     * @param {string} extractedId - 已由 uniqueCodeApi.js 提取处理后的ID
     * @returns {Promise}
     */
    setUniqueCodeId(extractedId) {
      if (extractedId && extractedId !== this.uniqueCodeId) {
        // 直接保存由外部处理后的ID
        this.uniqueCodeId = extractedId;
        console.log(`设置新的uniqueCodeId: ${this.uniqueCodeId}`);
        
        // 设置新ID后自动重新加载数据
        return this.initBookData();
      }
      return Promise.resolve();
    },
    
    /**
     * 设置分页配置
     * @param {Object} options - 分页配置选项
     */
    setPaginationOptions(options) {
      this.paginationOptions = {
        ...this.paginationOptions,
        ...options
      };
      
      console.log('[BookStore] 更新分页配置:', this.paginationOptions);
    }
  }
});