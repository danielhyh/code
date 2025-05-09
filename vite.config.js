import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { VantResolver } from '@vant/auto-import-resolver'
import pxtoviewport from 'postcss-px-to-viewport'

export default defineConfig({
  base: './', // 添加这行，使用相对路径
  plugins: [
    vue(),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets', // 指定静态资源目录
    emptyOutDir: true,
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  },
  css: {
    postcss: {
      plugins: [
        pxtoviewport({
          viewportWidth: 375, // 设计稿宽度
          unitPrecision: 5,
          viewportUnit: 'vw',
          selectorBlackList: [],
          minPixelValue: 1,
          mediaQuery: false
        })
      ]
    }
  },
  optimizeDeps: {
    include: ['pdfjs-dist'],
    exclude: ['pdfjs-dist/build/pdf.worker.entry']
  },
  server: {
    // host: '192.168.1.60', // 允许所有网络接口访问
    host: 'localhost',
    port: 5173, // 默认端口
    strictPort: true, // 如果端口被占用直接退出
    hmr: {
      clientPort: 5173 // 确保HMR在模拟器中正常工作
    }
  }
})