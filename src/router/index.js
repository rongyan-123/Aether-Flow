import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    component: () => import("@/pages/AiTalk.vue"),
  },
  {
    path: "/backpack",
    component: () => import("@/pages/BackPack.vue"),
  },
  {
    path: "/shuxing",
    component: () => import("@/pages/PlayerStats.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
export default router;
