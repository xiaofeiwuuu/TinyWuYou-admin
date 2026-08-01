<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { ImageTypeApi } from '#/api/manage/image-type';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteImageTypeApi, getImageTypeListApi } from '#/api/manage/image-type';
import { loadImageTypes } from '#/constants/image-type';

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

function onEdit(row: ImageTypeApi.ImageTypeInfo) {
  formModalApi.setData(row).open();
}

async function onDelete(row: ImageTypeApi.ImageTypeInfo) {
  try {
    await deleteImageTypeApi(row.id);
    message.success(`图片类型 ${row.name} 已删除`);
    refreshGrid();
  } catch {
    message.error('删除失败');
  }
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<ImageTypeApi.ImageTypeInfo>) {
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
    columns: useColumns(onActionClick, canEdit, canDelete),
    height: 'auto',
    keepSource: true,
    // 类型总共就几条，不分页
    pagerConfig: { enabled: false },
    stripe: true,
    proxyConfig: {
      // 注意：关掉分页后 vxe 读的是 response.list，不再读 response.result，
      // 两者是各自独立的配置项。配错了表格会静默显示为空。
      response: { list: 'list' },
      ajax: {
        query: async () => await getImageTypeListApi(),
      },
    },
    rowConfig: { isCurrent: true, isHover: true, keyField: 'id' },
    toolbarConfig: { custom: true, export: false, refresh: true, zoom: true },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
  // 图片管理/分类管理页共用这份类型配置，增删改后要强制重载，
  // 否则它们的类型下拉框会一直显示改动前的旧数据
  loadImageTypes(true);
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid table-title="图片类型">
      <template #toolbar-tools>
        <Button v-if="canCreate" type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增类型
        </Button>
        <span class="text-muted-foreground ml-3 text-xs">
          已被图片或分类使用的类型不能删除，可改为禁用
        </span>
      </template>
    </Grid>
  </Page>
</template>
