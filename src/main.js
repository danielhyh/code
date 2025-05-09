// main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { Lazyload, Icon, Loading, Toast, Empty } from 'vant';
import router from './router';
import App from './App.vue';

// 创建应用实例
const app = createApp(App);

// 使用Pinia状态管理
app.use(createPinia());

// 使用路由
app.use(router);

// 使用Vant组件
app.use(Lazyload, {
  lazyComponent: true,
  loading: 'https://img.yzcdn.cn/vant/loading-spin.svg',
  error: 'https://img.yzcdn.cn/vant/empty-image-default.png'
});
app.use(Icon);
app.use(Loading);
app.use(Toast);
app.use(Empty);

// 全局错误处理
app.config.errorHandler = (err, vm, info) => {
  console.error('全局错误:', err, info);
  // 修改前
  showToast({
    type: 'fail',
    message: '操作出错，请重试'
  });
  
  // 修改为
  Toast.fail('操作出错，请重试');
};

// 挂载应用
app.mount('#app');




// 移动端调试提示
// if (process.env.NODE_ENV === 'development') {
//   console.log('移动端书籍阅读应用已启动，使用浏览器开发工具模拟移动设备以获得最佳体验。');
// }