<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { VipManageApi } from '#/api/manage/vip';
import type { VbenFormProps } from '#/adapter/form';

import { Page, useVbenModal } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import { Plus } from '@vben/icons';
import { Button, message } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getVipCardListApi,
  deleteVipCardApi,
} from '#/api/manage/vip';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(null).open();
}

async function onDelete(row: VipManageApi.VipCardInfo) {
  const hideLoading = message.loading({
    content: `正在删除VIP卡 ${row.cardCode}...`,
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await deleteVipCardApi(row.id);
    message.success({
      content: `VIP卡 ${row.cardCode} 删除成功`,
      key: 'action_process_msg',
    });
    refreshGrid();
  } catch (error) {
    hideLoading();
    message.error('删除失败');
  }
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<VipManageApi.VipCardInfo>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
  }
}

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['vip:create']);
const canDelete = hasAccessByCodes(['vip:delete']);

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        placeholder: '卡号',
      },
    },
    {
      component: 'Select',
      fieldName: 'isUsed',
      label: '使用状态',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: '未使用', value: 0 },
          { label: '已使用', value: 1 },
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
    columns: useColumns(onActionClick, canDelete),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
    },
    stripe: true,
    proxyConfig: {
      response: {
        result: 'list',
        total: 'total',
      },
      ajax: {
        query: async ({ page }, formValues) => {
          const res = await getVipCardListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            keyword: formValues.keyword || undefined,
            isUsed: formValues.isUsed !== undefined && formValues.isUsed !== '' ? Number(formValues.isUsed) : undefined,
          });
          console.log('VIP卡列表数据:', res);

          return res;
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <Grid table-title="VIP卡管理">
      <template #toolbar-tools>
        <Button v-if="canCreate" type="primary" @click="onCreate">
          <Plus class="size-5" />
          批量生成
        </Button>
      </template>
    </Grid>
  </Page>
</template>
