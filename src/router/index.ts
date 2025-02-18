import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '@/views/DashboardView.vue'
import RocketsAndLaunchesView from '@/views/RocketsAndLaunchesView.vue'
import StarlinkView from '@/views/StarlinkView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DashboardView,
    },
    {
      path: '/rockets-and-launches',
      name: 'rockets-and-launches',
      component: RocketsAndLaunchesView,
    },
    {
      path: '/starlink',
      name: 'starlink',
      component: StarlinkView,
    },
  ],
})

export default router
