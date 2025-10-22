import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      authority: ['super_admin'],  // 只有超级管理员可见
      icon: 'lucide:settings',
      order: 9999,
      title: $t('系统设置'),
    },
    name: 'System',
    path: '/system',
    children: [
      {
        name: 'SystemAdminUser',
        path: '/system/admin-user',
        component: () => import('#/views/system/admin-user/index.vue'),
        meta: {
          icon: 'lucide:user-cog',
          title: $t('管理员管理'),
        },
      },
      {
        name: 'SystemOperationLog',
        path: '/system/operation-log',
        component: () => import('#/views/system/operation-log/index.vue'),
        meta: {
          icon: 'lucide:scroll-text',
          title: $t('操作日志'),
        },
      },
      {
        name: 'SystemPlatform',
        path: '/system/platform',
        component: () => import('#/views/manage/platform/index.vue'),
        meta: {
          icon: 'lucide:boxes',
          title: $t('平台配置'),
        },
      },
      {
        name: 'SystemAd',
        path: '/system/ad',
        component: () => import('#/views/manage/ad/index.vue'),
        meta: {
          icon: 'lucide:megaphone',
          title: $t('广告配置'),
        },
      },
    ],
  },
];

export default routes;
