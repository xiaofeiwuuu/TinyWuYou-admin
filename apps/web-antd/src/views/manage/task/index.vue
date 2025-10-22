<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TaskManageApi } from '#/api/manage/task';
import type { VbenFormProps } from '#/adapter/form';

import { Page, useVbenModal } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import { Plus } from '@vben/icons';
import { Button, message, Modal } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getTaskListApi,
  deleteTaskApi,
  updateTaskApi,
} from '#/api/manage/task';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: TaskManageApi.TaskInfo) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

async function onDelete(row: TaskManageApi.TaskInfo) {
  const hideLoading = message.loading({
    content: `正在删除任务 ${row.taskName}...`,
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await deleteTaskApi(row.id);
    message.success({
      content: `任务 ${row.taskName} 删除成功`,
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
}: OnActionClickParams<TaskManageApi.TaskInfo>) {
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

function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}

async function onStatusChange(
  newStatus: number,
  row: TaskManageApi.TaskInfo,
) {
  const statusText: Record<string, string> = {
    0: '禁用',
    1: '启用',
  };
  try {
    await confirm(
      `你要将「${row.taskName}」的状态切换为【${statusText[newStatus.toString()]}】吗?`,
      '切换状态',
    );
    await updateTaskApi(row.id, { isEnabled: newStatus });
    message.success('状态切换成功');
    return true;
  } catch {
    return false;
  }
}

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['task:create']);
const canEdit = hasAccessByCodes(['task:edit']);
const canDelete = hasAccessByCodes(['task:delete']);

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        placeholder: '任务名称',
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
    columns: useColumns(onActionClick, canEdit ? onStatusChange : undefined, canEdit, canDelete),
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
          const res = await getTaskListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            keyword: formValues.keyword || undefined,
          });
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
    <Grid table-title="任务配置">
      <template #toolbar-tools>
        <Button v-if="canCreate" type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增任务
        </Button>
      </template>
    </Grid>
  </Page>
</template>
