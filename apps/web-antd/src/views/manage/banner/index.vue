<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { BannerApi } from '#/api/manage/banner';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteBannerApi,
  getBannerListApi,
  updateBannerApi,
} from '#/api/manage/banner';

import { useColumns } from './data';
import Form from './modules/form.vue';

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['image:create']);
const canEdit = hasAccessByCodes(['image:edit']);
const canDelete = hasAccessByCodes(['image:delete']);

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(null).open();
}

function onEdit(row: BannerApi.BannerInfo) {
  formModalApi.setData(row).open();
}

async function onDelete(row: BannerApi.BannerInfo) {
  try {
    await deleteBannerApi(row.id);
    message.success('已删除');
    refreshGrid();
  } catch {
    message.error('删除失败');
  }
}

/** 把 Antd 的 Modal.confirm 包成 Promise，取消时 reject（开关随之回弹） */
function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      title,
      onOk: () => resolve(true),
      onCancel: () => reject(new Error('已取消')),
    });
  });
}

/** 列表里直接切换启用/禁用，返回 true 才让开关翻转 */
async function onStatusChange(
  newStatus: number,
  row: BannerApi.BannerInfo,
): Promise<boolean> {
  try {
    await confirm(
      `确定${newStatus === 1 ? '启用' : '禁用'}这张轮播图吗？`,
      '切换状态',
    );
    await updateBannerApi(row.id, { isEnabled: newStatus });
    message.success('状态已更新');
    return true;
  } catch {
    return false;
  }
}

function onActionClick({ code, row }: OnActionClickParams<BannerApi.BannerInfo>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(
      onActionClick,
      canEdit,
      canDelete,
      canEdit ? onStatusChange : undefined,
    ),
    height: 'auto',
    keepSource: true,
    // 轮播就几张，不分页
    pagerConfig: { enabled: false },
    stripe: true,
    proxyConfig: {
      response: { list: 'list' },
      ajax: {
        query: async () => await getBannerListApi(),
      },
    },
    rowConfig: { isCurrent: true, isHover: true, keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, zoom: true },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid table-title="首页轮播图">
      <template #toolbar-tools>
        <Button v-if="canCreate" type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增轮播图
        </Button>
        <span class="text-muted-foreground ml-3 text-xs">
          点击轮播图会跳转到所选图片分类；排序数值越大越靠前
        </span>
      </template>
    </Grid>
  </Page>
</template>
