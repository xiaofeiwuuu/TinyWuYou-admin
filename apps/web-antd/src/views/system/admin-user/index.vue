<script lang="ts" setup>
import { ref } from 'vue';
import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { Button, message, Modal } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAdminUserApi,
  getAdminUserListApi,
  updateAdminStatusApi,
} from '#/api/system/admin-user';
import { useColumns } from './data';
import AdminUserFormModal from './modules/form.vue';
import ResetPasswordModal from './modules/reset-password-modal.vue';

const { confirm } = Modal;

const formModalRef = ref<InstanceType<typeof AdminUserFormModal>>();
const resetPasswordModalRef = ref<InstanceType<typeof ResetPasswordModal>>();

async function onStatusChange(newStatus: number, row: any) {
  const statusText: Record<string, string> = { 0: '禁用', 1: '启用' };
  return new Promise((resolve, reject) => {
    confirm({
      title: '切换状态',
      content: `你要将「${row.username}」的状态切换为【${statusText[newStatus]}】吗？`,
      onOk: async () => {
        try {
          await updateAdminStatusApi(row.id, newStatus);
          message.success('状态切换成功');
          resolve(true);
        } catch (error) {
          message.error('状态切换失败');
          reject(error);
        }
      },
      onCancel: () => {
        reject(new Error('已取消'));
      },
    });
  });
}

async function onActionClick({ code, row }: any) {
  if (code === 'add') {
    formModalRef.value?.open();
    return;
  }
  if (code === 'edit') {
    formModalRef.value?.open(row);
    return;
  }
  if (code === 'resetPassword') {
    resetPasswordModalRef.value?.open(row);
    return;
  }
  if (code === 'delete') {
    try {
      await confirm({
        title: '删除确认',
        content: `确定要删除管理员「${row.username}」吗?此操作不可恢复。`,
      });
      await deleteAdminUserApi(row.id);
      message.success('删除成功');
      gridApi.reload();
    } catch {
      // 用户取消
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(onActionClick, onStatusChange),
    height: 'auto',
    proxyConfig: {
      response: {
        result: 'list',
        total: 'total',
      },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getAdminUserListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
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
  },
  gridEvents: {},
});
</script>

<template>
  <Page
    auto-content-height
    description="管理后台管理员账号,可创建多个管理员登录后台"
    title="管理员管理"
  >
    <Grid>
      <template #toolbar-tools>
        <Button type="primary" @click="onActionClick({ code: 'add' })">
          <template #icon>
            <Plus class="size-4" />
          </template>
          新增管理员
        </Button>
      </template>
    </Grid>

    <AdminUserFormModal ref="formModalRef" @success="gridApi.reload()" />
    <ResetPasswordModal ref="resetPasswordModalRef" @success="gridApi.reload()" />
  </Page>
</template>
