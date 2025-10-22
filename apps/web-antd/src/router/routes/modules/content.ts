import type { RouteRecordRaw } from 'vue-router';

import { BasicLayout } from '#/layouts';
import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    component: BasicLayout,
    meta: {
      icon: 'lucide:folder-open',
      order: 1,
      title: $t('内容管理'),
    },
    name: 'Content',
    path: '/content',
    children: [
      {
        name: 'ContentCategory',
        path: '/content/category',
        component: () => import('#/views/manage/category/index.vue'),
        meta: {
          icon: 'lucide:folder',
          title: $t('分类管理'),
        },
      },
      {
        name: 'ContentImage',
        path: '/content/image',
        component: () => import('#/views/manage/image/index.vue'),
        meta: {
          icon: 'lucide:image',
          title: $t('图片管理'),
        },
      },
      {
        name: 'ContentText',
        path: '/content/text',
        component: () => import('#/views/manage/text/index.vue'),
        meta: {
          icon: 'lucide:file-text',
          title: $t('文字管理'),
        },
      },
    ],
  },
];

export default routes;
