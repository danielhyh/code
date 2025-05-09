// src/api/bookApi.js
import axios from 'axios';

// API基础URL
const API_BASE_URL = 'http://113.45.143.70/prod-api';

/**
 * 从完整URL或字符串中提取ID
 * @param {string} id - 可能包含完整URL的ID字符串
 * @returns {string} - 提取出的纯ID
 */
export const extractId = (id) => {
  if (!id) return id;
  return id.includes('id=') 
    ? id.split('id=')[1].split('&')[0]
    : id;
};

/**
 * 获取书籍的章节列表 - 为BookList.vue提供数据
 * @param {string} id - 可能是uniqueCodeId或完整URL
 * @returns {Promise<Object>} - 书籍信息和章节列表的组合对象
 */
export const getBookChapters = async (id) => {
  try {
    // 提取纯ID
    const extractedId = extractId(id);
    
    const response = await axios.get(`${API_BASE_URL}/uniqueCode/manage/selectBookCatalogById`, {
      params: { id: extractedId }
    });
    console.log("API返回的原始数据:", response);
    
    if (response.data && response.data.code === 200 && response.data.data) {
      console.log("API返回的完整章节数据:", response.data);
      
      // 获取书籍基本信息
      const bookInfo = response.data.data;
      console.log("书籍基本信息:", bookInfo);
      
      // 从API返回数据中提取章节信息
      let chapters = [];

      if (bookInfo.uniqueCodes && bookInfo.uniqueCodes.length > 0) {
        chapters = bookInfo.uniqueCodes.map((code, index) => ({
          id: code.id || `chapter-${index + 1}`,
          title: `第${index + 1}章：${code.codeName || ''}`.trim(),
          bookId: bookInfo.bookId
        }));
      }
      
      // 返回书籍信息和章节列表的组合对象
      return {
        bookInfo: bookInfo,
        chapters: chapters
      };
    } else {
      throw new Error(response.data?.msg || '获取书籍目录失败');
    }
  } catch (error) {
    console.error('getBookChapters API错误:', error);
    throw error;
  }
};

/**
 * 转换API章节数据为应用所需格式
 * @param {Object} apiData - API返回的章节数据
 * @returns {Object} - 转换后的章节数据
 */
export const transformChapterData = (apiData) => {
  if (!apiData) {
    return {
      title: '未知章节',
      totalPages: 1,
      pages: [[{ type: 'text', data: '暂无内容' }]]
    };
  }
  
  // 如果API返回的数据已经符合应用预期的结构，直接返回
  if (apiData.title && apiData.pages) {
    return apiData;
  }
  
  // 否则进行转换
  const transformedData = {
    title: apiData.title || '未知章节',
    totalPages: apiData.totalPages || 1,
    pages: apiData.pages || [[{ type: 'text', data: apiData.content || apiData.codeContent || '暂无内容' }]]
  };
  
  // 打印转换后的数据
  console.log('转换后的章节数据:', transformedData);
  
  return transformedData;
};