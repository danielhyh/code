// router.js
import { createRouter, createWebHistory } from 'vue-router';
import BookList from './pages/BookList.vue';
import BookDetail from './pages/BookDetail.vue';
// 基础路径配置
const BASE_PATH = '/book_h5/';
const routes = [
  {
    path: '/',
    component: BookList,
    name: 'BookList',
    meta: {
      title: '带您阅智享阅读器'
    }
  },
  {
    path: '/detail/:chapterId',
    component: BookDetail,
    name: 'BookDetail',
    meta: {
      title: '章节阅读'
    }
  },

  // 重定向任意未匹配路由到首页
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
];

const router = createRouter({
  history: createWebHistory(BASE_PATH),
  routes
});

// 全局导航守卫 - 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置文档标题
  document.title = to.meta.title || '带您阅智享阅读器';

  // 继续导航
  next();
});

export default router;
