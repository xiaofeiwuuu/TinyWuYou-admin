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
import { onMounted, ref, computed } from 'vue';
import {
  getTextListApi,
  deleteTextApi,
  auditTextApi,
  batchDeleteTextsApi,
} from '#/api/manage/text';
import { getCategoryListApi } from '#/api/manage/category';

import { useColumns } from './data';
import Form from './modules/form.vue';
import BatchEditForm from './modules/batch-edit-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [BatchEditModal, batchEditModalApi] = useVbenModal({
  connectedComponent: BatchEditForm,
  destroyOnClose: true,
});

// 选中的行数据
const selectedRows = ref<TextManageApi.TextInfo[]>([]);
const selectedIds = computed(() => selectedRows.value.map((row) => row.id));
const selectedCount = computed(() => selectedRows.value.length);

// 确认对话框
function confirm(content: string, title: string = '确认') {
  return new Promise((resolve, reject) => {
    AModal.confirm({
      title,
      content,
      onOk: () => resolve(true),
      onCancel: () => reject(false),
    });
  });
}

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

// 批量编辑分类
function onBatchEdit() {
  // 实时获取选中的记录
  const $grid = gridApi.grid;
  if ($grid) {
    const selectRecords = $grid.getCheckboxRecords() as TextManageApi.TextInfo[];
    const reserveRecords = $grid.getCheckboxReserveRecords() as TextManageApi.TextInfo[];
    selectedRows.value = [...selectRecords, ...reserveRecords];

    console.log('[Text] 批量编辑 - 当前选中:', {
      当前页: selectRecords.length,
      跨页保留: reserveRecords.length,
      总计: selectedRows.value.length,
      IDs: selectedRows.value.map(r => r.id)
    });
  }

  if (selectedCount.value === 0) {
    message.warning('请先选择要编辑的文案');
    return;
  }

  batchEditModalApi
    .setData({
      selectedIds: selectedIds.value,
      selectedCount: selectedCount.value,
    })
    .open();
}

// 批量删除
async function onBatchDelete() {
  // 实时获取选中的记录
  const $grid = gridApi.grid;
  if ($grid) {
    const selectRecords = $grid.getCheckboxRecords() as TextManageApi.TextInfo[];
    const reserveRecords = $grid.getCheckboxReserveRecords() as TextManageApi.TextInfo[];
    selectedRows.value = [...selectRecords, ...reserveRecords];

    console.log('[Text] 批量删除 - 当前选中:', {
      当前页: selectRecords.length,
      跨页保留: reserveRecords.length,
      总计: selectedRows.value.length,
      IDs: selectedRows.value.map(r => r.id)
    });
  }

  if (selectedCount.value === 0) {
    message.warning('请先选择要删除的文案');
    return;
  }

  try {
    await confirm(
      `确定要删除选中的 ${selectedCount.value} 条文案吗？此操作不可恢复！`,
      '批量删除确认',
    );

    const hideLoading = message.loading({
      content: `正在删除 ${selectedCount.value} 条文案...`,
      duration: 0,
      key: 'batch_delete_msg',
    });

    try {
      await batchDeleteTextsApi(selectedIds.value);
      message.success({
        content: `成功删除 ${selectedCount.value} 条文案`,
        key: 'batch_delete_msg',
      });

      onBatchSuccess();
    } catch (error) {
      hideLoading();
      message.error('批量删除失败');
    }
  } catch {
    // 用户取消
  }
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
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
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
        dropdownMatchSelectWidth: false,
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
        dropdownMatchSelectWidth: false,
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
    checkboxConfig: {
      highlight: true,
      reserve: true,
    },
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
          return await getTextListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            keyword: formValues.keyword || undefined,
            categoryId: formValues.categoryId ? Number(formValues.categoryId) : undefined,
            status: formValues.status !== undefined && formValues.status !== '' ? Number(formValues.status) : undefined,
            sortBy: sort?.field,
            sortOrder: sort?.order === 'desc' ? 'DESC' : 'ASC',
          });
        },
      },
      sort: true,
    },
    sortConfig: {
      remote: true,
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

// 监听选择变化
function onCheckboxChange() {
  const $grid = gridApi.grid;
  if ($grid) {
    const selectRecords = $grid.getCheckboxRecords() as TextManageApi.TextInfo[];
    const reserveRecords = $grid.getCheckboxReserveRecords() as TextManageApi.TextInfo[];
    selectedRows.value = [...selectRecords, ...reserveRecords];

    console.log(
      `[Text] 当前页勾选: ${selectRecords.length} 条, 已保留勾选: ${reserveRecords.length} 条, 总计: ${selectedRows.value.length} 条`,
    );
  }
}

// 批量操作成功后的回调
function onBatchSuccess() {
  selectedRows.value = [];
  const $grid = gridApi.grid;
  if ($grid) {
    $grid.clearCheckboxRow();
    $grid.clearCheckboxReserve();
  }
  refreshGrid();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <BatchEditModal @success="onBatchSuccess" />
    <Grid
      table-title="文案管理"
      @checkbox-change="onCheckboxChange"
      @checkbox-all="onCheckboxChange"
    >
      <template #toolbar-tools>
        <div class="flex gap-2">
          <!-- 已选择提示 -->
          <div
            v-if="selectedCount > 0"
            class="mr-4 flex items-center gap-2 rounded bg-blue-50 px-3 py-1"
          >
            <span class="text-sm text-blue-600"
              >已选择 {{ selectedCount }} 项</span
            >
          </div>

          <!-- 批量操作按钮 -->
          <Button v-if="canEdit" type="default" @click="onBatchEdit">
            批量编辑分类
          </Button>
          <Button v-if="canDelete" danger @click="onBatchDelete">
            批量删除
          </Button>

          <!-- 新增按钮 -->
          <Button v-if="canCreate" type="primary" @click="onCreate">
            <Plus class="size-5" />
            新增文案
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
