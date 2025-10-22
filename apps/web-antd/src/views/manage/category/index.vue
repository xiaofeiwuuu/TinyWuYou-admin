<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { CategoryManageApi } from '#/api/manage/category';
import type { VbenFormProps } from '#/adapter/form';

import { Page, useVbenModal } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import { Plus } from '@vben/icons';
import { Button, message, Modal } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getCategoryListApi,
  deleteCategoryApi,
  updateCategoryApi,
} from '#/api/manage/category';
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';

import { useColumns } from './data';
import Form from './modules/form.vue';

const { hasAccessByCodes } = useAccess();

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onEdit(row: CategoryManageApi.CategoryInfo) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

async function onDelete(row: CategoryManageApi.CategoryInfo) {
  const hideLoading = message.loading({
    content: `正在删除分类 ${row.name}...`,
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await deleteCategoryApi(row.id);
    message.success({
      content: `分类 ${row.name} 删除成功`,
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
}: OnActionClickParams<CategoryManageApi.CategoryInfo>) {
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

/**
 * 将Antd的Modal.confirm封装为promise，方便在异步函数中调用。
 * @param content 提示内容
 * @param title 提示标题
 */
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

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(
  newStatus: number,
  row: CategoryManageApi.CategoryInfo,
) {
  const statusText: Record<string, string> = {
    0: '禁用',
    1: '启用',
  };
  try {
    await confirm(
      `你要将「${row.name}」的状态切换为【${statusText[newStatus.toString()]}】吗？`,
      '切换状态',
    );
    await updateCategoryApi(row.id, { status: newStatus });
    message.success('状态切换成功');
    return true;
  } catch {
    return false;
  }
}

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        placeholder: '分类名称',
      },
    },
    {
      component: 'Select',
      fieldName: 'contentType',
      label: '内容类型',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: '图片', value: 'image' },
          { label: '文案', value: 'text' },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'imageType',
      label: '图片类型',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: IMAGE_TYPE_OPTIONS.map(item => ({ label: item.label, value: item.value })),
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
          { label: '禁用', value: 0 },
          { label: '启用', value: 1 },
        ],
      },
    },
  ],
  wrapperClass: 'grid-cols-5',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

// 检查权限
const canCreate = hasAccessByCodes(['category:create']);
const canEdit = hasAccessByCodes(['category:edit']);
const canDelete = hasAccessByCodes(['category:delete']);

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
        query: async ({ page, sort }, formValues) => {
          const res = await getCategoryListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            keyword: formValues.keyword || undefined,
            contentType: formValues.contentType || undefined,
            imageType: formValues.imageType || undefined,
            status: formValues.status !== undefined && formValues.status !== '' ? Number(formValues.status) : undefined,
            sortBy: sort?.field,
            sortOrder: sort?.order === 'desc' ? 'DESC' : 'ASC',
          });
          console.log('分类列表数据:', res);

          return res;
        },
      },
      sort: true,
    },
    sortConfig: {
      remote: true,
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
    <Grid table-title="分类管理">
      <template #toolbar-tools>
        <Button v-if="canCreate" type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增分类
        </Button>
      </template>
    </Grid>
  </Page>
</template>
