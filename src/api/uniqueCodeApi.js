// src/api/uniqueCodeApi.js
import axios from 'axios';

// API基础URL
const API_BASE_URL = 'http://113.45.143.70/prod-api';

/**
 * 根据章节ID获取书籍数据和章节内容 - 为BookDetail.vue提供数据
 * @param {string} chapterId - 章节ID
 * @returns {Promise<Object>} - 转换后的书籍数据
 */
// export const getBookDataByChapterId = async (chapterId) => {
//   try {
//     const response = await axios.get(`${API_BASE_URL}/uniqueCode/manage/selectUniqueCodeById`, {
//       params: { id: chapterId }
//     });

//     console.log("API响应:", response);
    
//     // 检查响应状态
//     if (response.data && response.data.code === 200 && response.data.data) {
//       // 转换API响应为应用需要的数据结构
//       console.log("API返回的书籍数据:", response.data);
//       return transformBookData(response.data.data);
//     } else {
//       throw new Error(response.data?.msg || '获取书籍数据失败');
//     }
//   } catch (error) {
//     console.error('getBookDataByChapterId API错误:', error);
//     throw error;
//   }
// };

export const getBookDataByChapterId = async (chapterId) => {
  try {
    // 从完整URL中提取ID部分（如果传入的是完整URL）
    const extractedId = chapterId.includes('id=') 
      ? chapterId.split('id=')[1].split('&')[0]
      : chapterId;

    const response = await axios.get(`${API_BASE_URL}/uniqueCode/manage/selectUniqueCodeById`, {
      params: { id: extractedId }
    });

    console.log("API响应:", response);
    
    // 检查响应状态
    if (response.data && response.data.code === 200 && response.data.data) {
      // 转换API响应为应用需要的数据结构
      console.log("API返回的书籍数据:", response.data);
      return transformBookData(response.data.data);
    } else {
      throw new Error(response.data?.msg || '获取书籍数据失败');
    }
  } catch (error) {
    console.error('getBookDataByChapterId API错误:', error);
    throw error;
  }
};

/**
 * 转换API返回的书籍数据为应用所需格式
 * @param {Object} apiData - API返回的原始数据
 * @returns {Object} - 转换后的书籍数据
 */
const transformBookData = (apiData) => {
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // 准备章节内容 - 这里将codeContent转换为阅读器所需的格式
  let chapterContent = null;
  if (apiData.codeContent) {
    chapterContent = {
      title: apiData.codeName || '章节内容',
      totalPages: 1,
      pages: [[{ type: 'text', data: apiData.codeContent || '暂无内容' }]]
    };
  }
  
  const transformedData = {
    id: apiData.bookId || 1,
    title: apiData.bookName || '未知书名',
    author: apiData.bookAuthor || '未知作者',
    category: apiData.bookTypeName || '其他',
    cover: apiData.coverImage || '',
    description: apiData.bookDescribe || '暂无描述',
    publishDate: formatDate(apiData.createTime),
    // 直接保存当前章节内容，供BookDetail.vue使用
    currentChapter: chapterContent,
    // 这个字段只用于存储，不用于显示
    content: apiData.codeContent || '',
    // 章节信息会从getBookChapters API中获取
    chapters: []
  };

  // 打印转换后的数据
  console.log('转换后的书籍数据:', transformedData);
  
  return transformedData;
};