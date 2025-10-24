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
  batchDeleteImagesApi,
} from '#/api/manage/image';
import { getCategoryListApi } from '#/api/manage/category';
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';
import { ref, computed } from 'vue';

import { useColumns } from './data';
import Form from './modules/form.vue';
import BatchForm from './modules/batch-form.vue';
import BatchEditForm from './modules/batch-edit-form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [BatchFormModal, batchFormModalApi] = useVbenModal({
  connectedComponent: BatchForm,
  destroyOnClose: true,
});

const [BatchEditModal, batchEditModalApi] = useVbenModal({
  connectedComponent: BatchEditForm,
  destroyOnClose: true,
});

// 选中的行数据
const selectedRows = ref<ImageManageApi.ImageInfo[]>([]);
const selectedIds = computed(() => selectedRows.value.map((row) => row.id));
const selectedCount = computed(() => selectedRows.value.length);

function onEdit(row: ImageManageApi.ImageInfo) {
  formModalApi.setData(row).open();
}

function onCreate() {
  formModalApi.setData(null).open();
}

function onBatchCreate() {
  batchFormModalApi.open();
}

// 批量编辑
function onBatchEdit() {
  // 实时获取选中的记录
  const $grid = gridApi.grid;
  if ($grid) {
    const selectRecords = $grid.getCheckboxRecords() as ImageManageApi.ImageInfo[];
    const reserveRecords = $grid.getCheckboxReserveRecords() as ImageManageApi.ImageInfo[];
    selectedRows.value = [...selectRecords, ...reserveRecords];

    console.log('[Image] 批量编辑 - 当前选中:', {
      当前页: selectRecords.length,
      跨页保留: reserveRecords.length,
      总计: selectedRows.value.length,
      IDs: selectedRows.value.map(r => r.id)
    });
  }

  if (selectedCount.value === 0) {
    message.warning('请先选择要编辑的图片');
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
    const selectRecords = $grid.getCheckboxRecords() as ImageManageApi.ImageInfo[];
    const reserveRecords = $grid.getCheckboxReserveRecords() as ImageManageApi.ImageInfo[];
    selectedRows.value = [...selectRecords, ...reserveRecords];

    console.log('[Image] 批量删除 - 当前选中:', {
      当前页: selectRecords.length,
      跨页保留: reserveRecords.length,
      总计: selectedRows.value.length,
      IDs: selectedRows.value.map(r => r.id)
    });
  }

  if (selectedCount.value === 0) {
    message.warning('请先选择要删除的图片');
    return;
  }

  try {
    await confirm(
      `确定要删除选中的 ${selectedCount.value} 张图片吗？此操作不可恢复！`,
      '批量删除确认',
    );

    const hideLoading = message.loading({
      content: `正在删除 ${selectedCount.value} 张图片...`,
      duration: 0,
      key: 'batch_delete_msg',
    });

    try {
      await batchDeleteImagesApi(selectedIds.value);
      message.success({
        content: `成功删除 ${selectedCount.value} 张图片`,
        key: 'batch_delete_msg',
      });

      // 清空选择
      selectedRows.value = [];

      refreshGrid();
    } catch (error) {
      hideLoading();
      message.error('批量删除失败');
    }
  } catch {
    // 用户取消
  }
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
        dropdownMatchSelectWidth: false,
        placeholder: '全部',
        options: IMAGE_TYPE_OPTIONS.map((item) => ({
          label: item.label,
          value: item.value,
        })),
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
              pageSize: 100,
            });
            return {
              options: res.list.map((item) => ({
                label: item.name,
                value: item.id,
              })),
            };
          }
          // 没有选择图片类型，加载所有图片分类
          const res = await getCategoryListApi({
            contentType: 'image',
            page: 1,
            pageSize: 100,
          });
          return {
            options: res.list.map((item) => ({
              label: item.name,
              value: item.id,
            })),
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
        dropdownMatchSelectWidth: false,
        options: [
          { label: '禁用', value: 0 },
          { label: '启用', value: 1 },
        ],
      },
    },
  ],
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['image:create']);
const canEdit = hasAccessByCodes(['image:edit']);
const canDelete = hasAccessByCodes(['image:delete']);

console.log('[Image] 权限检查:', { canCreate, canEdit, canDelete });

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    columns: useColumns(
      onActionClick,
      canEdit ? onStatusChange : undefined,
      canEdit,
      canDelete,
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
        query: async ({ page, sort }, formValues) => {
          return await getImageListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            id: formValues.id ? Number(formValues.id) : undefined,
            keyword: formValues.keyword || undefined,
            imageType: formValues.imageType || undefined,
            categoryId: formValues.categoryId
              ? Number(formValues.categoryId)
              : undefined,
            status:
              formValues.status !== undefined && formValues.status !== ''
                ? Number(formValues.status)
                : undefined,
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
    // 开启多选
    checkboxConfig: {
      highlight: true,
      reserve: true,
      range: true, // 支持鼠标拖拽范围选择
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
    // 获取当前页选中的记录
    const selectRecords = $grid.getCheckboxRecords() as ImageManageApi.ImageInfo[];
    // 获取跨页保留选中的记录
    const reserveRecords = $grid.getCheckboxReserveRecords() as ImageManageApi.ImageInfo[];

    // 合并两种选中记录
    selectedRows.value = [...selectRecords, ...reserveRecords];

    console.log(
      `[Image] 当前页勾选: ${selectRecords.length} 条, 已保留勾选: ${reserveRecords.length} 条, 总计: ${selectedRows.value.length} 条`,
    );
  }
}

// 范围选择开始
function onCheckboxRangeStart() {
  console.log('[Image] 开始拖拽范围选择');
}

// 范围选择结束
function onCheckboxRangeEnd({ records }: { records: ImageManageApi.ImageInfo[] }) {
  console.log(`[Image] 结束拖拽选择, 本次选择 ${records.length} 条`);
}

// 批量操作成功后的回调
function onBatchSuccess() {
  // 清空选择
  selectedRows.value = [];
  const $grid = gridApi.grid;
  if ($grid) {
    $grid.clearCheckboxRow();
    $grid.clearCheckboxReserve(); // 清除保留选择
  }
  refreshGrid();
}
</script>

<template>
  <Page auto-content-height>
    <FormModal @success="refreshGrid" />
    <BatchFormModal @success="refreshGrid" />
    <BatchEditModal @success="onBatchSuccess" />
    <Grid
      table-title="图片管理"
      @checkbox-change="onCheckboxChange"
      @checkbox-all="onCheckboxChange"
      @checkbox-range-start="onCheckboxRangeStart"
      @checkbox-range-end="onCheckboxRangeEnd"
    >
      <template #toolbar-tools>
        <div class="flex gap-2">
          <!-- 批量操作按钮 -->
          <template>
            <div
              class="mr-4 flex items-center gap-2 rounded bg-blue-50 px-3 py-1"
            >
              <span class="text-sm text-blue-600"
                >已选择 {{ selectedCount }} 项</span
              >
            
            </div>
          </template>

          <!-- 新增按钮 -->
          <template v-if="canCreate">
            <Button v-if="canEdit" type="default" @click="onBatchEdit">
              <!-- <Edit class="size-4" /> -->
              批量编辑
            </Button>
            <Button v-if="canDelete" danger @click="onBatchDelete">
              <!-- <Delete class="size-4" /> -->
              批量删除
            </Button>
            <Button type="primary" @click="onCreate">
              <Plus class="size-5" />
              新增图片
            </Button>
            <Button type="primary" @click="onBatchCreate">
              <Plus class="size-5" />
              批量上传
            </Button>
          </template>
        </div>
      </template>
    </Grid>
  </Page>
</template>
