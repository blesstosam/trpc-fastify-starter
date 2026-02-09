import NProgress from 'nprogress'
import { createRouter, createWebHistory } from 'vue-router'
import { isLoggedIn } from '../utils/auth'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      meta: {
        title: '登录',
      },
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/tags',
      name: 'tags',
      meta: {
        title: '标签管理',
        requiresAuth: true,
      },
      component: () => import('../views/TagManageView.vue'),
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
