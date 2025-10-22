<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { ImageManageApi } from '#/api/manage/image';
import type { VbenFormProps } from '#/adapter/form';

import { Page, useVbenModal } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import { Plus } from '@vben/icons';
import { Button, message, Modal as AModal } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getImageListApi,
  deleteImageApi,
  updateImageApi,
} from '#/api/manage/image';
import { getCategoryListApi } from '#/api/manage/category';
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';

import { useColumns } from './data';
import Form from './modules/form.vue';
import BatchForm from './modules/batch-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [BatchFormModal, batchFormModalApi] = useVbenModal({
  connectedComponent: BatchForm,
  destroyOnClose: true,
});

function onEdit(row: ImageManageApi.ImageInfo) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

function onBatchCreate() {
  batchFormModalApi.open();
}

async function onDelete(row: ImageManageApi.ImageInfo) {
  const hideLoading = message.loading({
    content: `正在删除图片 ${row.title}...`,
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await deleteImageApi(row.id);
    message.success({
      content: `图片 ${row.title} 删除成功`,
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
}: OnActionClickParams<ImageManageApi.ImageInfo>) {
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
    AModal.confirm({
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
  row: ImageManageApi.ImageInfo,
) {
  const statusText: Record<string, string> = {
    0: '禁用',
    1: '启用',
  };
  try {
    await confirm(
      `你要将「${row.title}」的状态切换为【${statusText[newStatus.toString()]}】吗？`,
      '切换状态',
    );
    await updateImageApi(row.id, { status: newStatus } as any);
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
      fieldName: 'id',
      label: 'ID',
      componentProps: {
        placeholder: '图片ID',
      },
    },
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        placeholder: '标题',
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
      fieldName: 'categoryId',
      label: '分类',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [],
      },
      dependencies: {
        async componentProps(values) {
          // 如果选择了图片类型，只加载该类型的分类
          if (values.imageType) {
            const res = await getCategoryListApi({
              contentType: 'image',
              imageType: values.imageType,
              page: 1,
              pageSize: 100
            });
            return {
              options: res.list.map((item) => ({ label: item.name, value: item.id })),
            };
          }
          // 没有选择图片类型，加载所有图片分类
          const res = await getCategoryListApi({
            contentType: 'image',
            page: 1,
            pageSize: 100
          });
          return {
            options: res.list.map((item) => ({ label: item.name, value: item.id })),
          };
        },
        triggerFields: ['imageType'],
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
  wrapperClass: 'grid-cols-6',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['image:create']);
const canEdit = hasAccessByCodes(['image:edit']);
const canDelete = hasAccessByCodes(['image:delete']);

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
          const res = await getImageListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            id: formValues.id ? Number(formValues.id) : undefined,
            keyword: formValues.keyword || undefined,
            imageType: formValues.imageType || undefined,
            categoryId: formValues.categoryId ? Number(formValues.categoryId) : undefined,
            status: formValues.status !== undefined && formValues.status !== '' ? Number(formValues.status) : undefined,
            sortBy: sort?.field,
            sortOrder: sort?.order === 'desc' ? 'DESC' : 'ASC',
          });
          console.log(123,res);

          return res
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
    <BatchFormModal @success="refreshGrid" />
    <Grid table-title="图片管理">
      <template #toolbar-tools>
        <div v-if="canCreate" class="flex gap-2">
          <Button type="primary" @click="onCreate">
            <Plus class="size-5" />
            新增图片
          </Button>
          <Button type="primary" @click="onBatchCreate">
            <Plus class="size-5" />
            批量上传
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
