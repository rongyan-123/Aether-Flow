import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: '/',
    component: () => import("../pages/HomePage.vue")
  },
  {
    path: '/Ai',
    component: () => import("../pages/AiTalk.vue")
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router 