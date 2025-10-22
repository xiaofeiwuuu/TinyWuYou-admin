import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:activity',
      order: 3,
      title: $t('运营管理'),
    },
    name: 'Operation',
    path: '/operation',
    children: [
      {
        name: 'OperationVip',
        path: '/operation/vip',
        component: () => import('#/views/manage/vip/index.vue'),
        meta: {
          icon: 'lucide:crown',
          title: $t('VIP卡密'),
        },
      },
      {
        name: 'OperationTask',
        path: '/operation/task',
        component: () => import('#/views/manage/task/index.vue'),
        meta: {
          icon: 'lucide:list-checks',
          title: $t('任务配置'),
        },
      },
      {
        name: 'OperationMiniProgram',
        path: '/operation/miniprogram',
        component: () => import('#/views/manage/miniprogram/index.vue'),
        meta: {
          icon: 'lucide:smartphone',
          title: $t('推广小程序'),
        },
      },
    ],
  },
];

export default routes;
