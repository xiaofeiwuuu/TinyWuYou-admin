<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { AnnouncementApi } from '#/api/manage/announcement';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { Button, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAnnouncementApi,
  getAnnouncementListApi,
} from '#/api/manage/announcement';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(null).open();
}

function onEdit(row: AnnouncementApi.Info) {
  formModalApi.setData(row).open();
}

async function onDelete(row: AnnouncementApi.Info) {
  try {
    await deleteAnnouncementApi(row.id);
    message.success('已删除');
    refreshGrid();
  } catch {
    message.error('删除失败');
  }
}

function onActionClick({ code, row }: OnActionClickParams<AnnouncementApi.Info>) {
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
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    stripe: true,
    proxyConfig: {
      response: { result: 'list', total: 'total' },
      ajax: {
        query: async ({ page }) => {
          return await getAnnouncementListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
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
    <Grid table-title="公告管理">
      <template #toolbar-tools>
        <Button type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增公告
        </Button>
      </template>
    </Grid>
  </Page>
</template>
