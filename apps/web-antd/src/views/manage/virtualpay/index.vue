<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { VbenFormProps } from '#/adapter/form';
import type { VirtualPayApi } from '#/api/manage/virtualpay';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteVirtualPayApi, getVirtualPayListApi } from '#/api/manage/virtualpay';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(null).open();
}

function onEdit(row: VirtualPayApi.ProductInfo) {
  formModalApi.setData(row).open();
}

async function onDelete(row: VirtualPayApi.ProductInfo) {
  // 二次确认由 CellOperation 的 delete 预设内置，这里直接删
  try {
    await deleteVirtualPayApi(row.id);
    message.success('已删除');
    refreshGrid();
  } catch {
    message.error('删除失败');
  }
}

function onActionClick({ code, row }: OnActionClickParams<VirtualPayApi.ProductInfo>) {
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

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'name',
      label: '商品名称',
      componentProps: { placeholder: '按名称搜索' },
    },
    {
      component: 'Select',
      fieldName: 'type',
      label: '类型',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: 'VIP会员', value: 'vip' },
          { label: '下载次数', value: 'download' },
        ],
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    stripe: true,
    proxyConfig: {
      response: { result: 'list', total: 'total' },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getVirtualPayListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            name: formValues.name || undefined,
            type: formValues.type || undefined,
          });
        },
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
    <Grid table-title="虚拟商品管理">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增商品
        </Button>
      </template>
    </Grid>
  </Page>
</template>
