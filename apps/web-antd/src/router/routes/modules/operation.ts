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
        // 放在「运营管理」而不是「系统设置」：这一页全是展示文案和公告，
        // 改错了影响面是"文案不对"，不是"改了定价或下载限额"，
        // 所以后端也只要求 admin，不限 super_admin，两边保持一致。
        name: 'OperationAppInfo',
        path: '/operation/app-info',
        component: () => import('#/views/manage/app-info/index.vue'),
        meta: {
          icon: 'lucide:info',
          title: $t('小程序信息'),
        },
      },
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
