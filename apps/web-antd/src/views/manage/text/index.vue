<script lang="ts" setup>
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { TextManageApi } from '#/api/manage/text';
import type { VbenFormProps } from '#/adapter/form';

import { Page, useVbenModal } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import { Plus } from '@vben/icons';
import { Button, message, Modal as AModal } from 'ant-design-vue';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { onMounted, ref } from 'vue';
import {
  getTextListApi,
  deleteTextApi,
  auditTextApi,
} from '#/api/manage/text';
import { getCategoryListApi } from '#/api/manage/category';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const categories = ref<any[]>([]);

const loadCategories = async () => {
  try {
    const res = await getCategoryListApi({ contentType: 'text', page: 1, pageSize: 100 });
    categories.value = res.list.map((item) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (error) {
    console.error('加载分类失败', error);
  }
};

onMounted(() => {
  loadCategories();
});

function onEdit(row: TextManageApi.TextInfo) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

async function onDelete(row: TextManageApi.TextInfo) {
  const hideLoading = message.loading({
    content: `正在删除文案...`,
    duration: 0,
    key: 'action_process_msg',
  });

  try {
    await deleteTextApi(row.id);
    message.success({
      content: `文案删除成功`,
      key: 'action_process_msg',
    });
    refreshGrid();
  } catch (error) {
    hideLoading();
    message.error('删除失败');
  }
}

async function onAudit(row: TextManageApi.TextInfo) {
  AModal.confirm({
    title: '审核文案',
    content: `请选择审核结果`,
    okText: '通过',
    cancelText: '拒绝',
    onOk: async () => {
      try {
        await auditTextApi(row.id, 1);
        message.success('审核通过');
        refreshGrid();
      } catch (error) {
        message.error('审核失败');
      }
    },
    onCancel: async () => {
      try {
        await auditTextApi(row.id, 2);
        message.success('审核拒绝');
        refreshGrid();
      } catch (error) {
        message.error('审核失败');
      }
    },
  });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<TextManageApi.TextInfo>) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'audit': {
      onAudit(row);
      break;
    }
  }
}

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['text:create']);
const canEdit = hasAccessByCodes(['text:edit']);
const canDelete = hasAccessByCodes(['text:delete']);

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        placeholder: '文案内容',
      },
    },
    {
      component: 'Select',
      fieldName: 'categoryId',
      label: '分类',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: categories,
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
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    columns: useColumns(onActionClick, canEdit, canDelete),
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
          const res = await getTextListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            keyword: formValues.keyword || undefined,
            categoryId: formValues.categoryId ? Number(formValues.categoryId) : undefined,
            status: formValues.status !== undefined && formValues.status !== '' ? Number(formValues.status) : undefined,
            sortBy: sort?.field,
            sortOrder: sort?.order === 'desc' ? 'DESC' : 'ASC',
          });
          console.log('文字列表数据:', res);

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
    <Grid table-title="文案管理">
      <template #toolbar-tools>
        <Button v-if="canCreate" type="primary" @click="onCreate">
          <Plus class="size-5" />
          新增文案
        </Button>
      </template>
    </Grid>
  </Page>
</template>
