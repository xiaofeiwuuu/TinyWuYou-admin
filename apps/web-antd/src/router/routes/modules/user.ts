import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:users',
      order: 2,
      title: $t('用户管理'),
    },
    name: 'User',
    path: '/user',
    children: [
      {
        name: 'UserList',
        path: '/user/list',
        component: () => import('#/views/manage/user/index.vue'),
        meta: {
          icon: 'lucide:user',
          title: $t('用户列表'),
        },
      },
      {
        name: 'UserInvitation',
        path: '/user/invitation',
        component: () => import('#/views/manage/invitation/index.vue'),
        meta: {
          icon: 'lucide:user-plus',
          title: $t('邀请记录'),
        },
      },
      // {
      //   name: 'UserCollection',
      //   path: '/user/collection',
      //   component: () => import('#/views/manage/collection/index.vue'),
      //   meta: {
      //     icon: 'lucide:heart',
      //     title: $t('收藏记录'),
      //   },
      // },
    ],
  },
];

export default routes;
