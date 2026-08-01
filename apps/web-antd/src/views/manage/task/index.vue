<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TaskManageApi } from '#/api/manage/task';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';

import { message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getTaskListApi,
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

function onActionClick({
  code,
  row,
}: OnActionClickParams<TaskManageApi.TaskInfo>) {
  switch (code) {
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

async function onStatusChange(newStatus: number, row: TaskManageApi.TaskInfo) {
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
const canEdit = hasAccessByCodes(['task:edit']);

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  schema: [
    {
      component: 'Select',
      fieldName: 'taskType',
      label: '任务类型',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: '新手任务', value: 'newbie' },
          { label: '签到任务', value: 'signin' },
          { label: '邀请任务', value: 'invite' },
          { label: '广告任务', value: 'ad' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
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
    columns: useColumns(
      onActionClick,
      canEdit ? onStatusChange : undefined,
      canEdit,
    ),
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
            taskType: formValues.taskType || undefined,
            status:
              formValues.status !== undefined && formValues.status !== ''
                ? Number(formValues.status)
                : undefined,
          });
          return res;
        },
      },
    },
    rowConfig: { isCurrent: true, isHover: true },
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
        <!-- 任务是固定四条（新人/签到/邀请/广告），每条都对应一段后端发放逻辑
             和小程序点击行为，只能改配置不能增删，所以这里没有"新增"入口 -->
        <span class="text-muted-foreground text-xs">
          任务类型固定，仅可调整奖励与启用状态
        </span>
      </template>
    </Grid>
  </Page>
</template>
