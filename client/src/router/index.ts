import NProgress from 'nprogress'
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../home/HomeView.vue'
import { isLoggedIn } from '../shared/utils/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      meta: {
        title: '登录',
      },
      component: () => import('../login/LoginView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      meta: {
        title: '标签管理',
        requiresAuth: true,
      },
      component: () => import('../tag-manage/TagManage.vue'),
    },
    {
      path: '/file-demo',
      name: 'file-demo',
      meta: {
        title: '图片上传Demo',
        requiresAuth: true,
      },
      component: () => import('../upload-demo/UploadDemo.vue'),
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  if (to.path !== from.path) {
    NProgress.start()
  }

  if (to.path === '/login' && isLoggedIn()) {
    next('/')
    return
  }

  if (to.meta.requiresAuth && !isLoggedIn()) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }

  next()
})

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    const { title } = to.meta
    document.title = `${title}`
  }
  if (!to.meta.cache) {
    window.scrollTo(0, 0)
  }
  NProgress.done()
})

export default router
