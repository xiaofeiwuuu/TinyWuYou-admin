<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type {
  OnActionClickParams,
  VxeTableGridOptions,
} from '#/adapter/vxe-table';
import type { VipManageApi } from '#/api/manage/vip';

import { useAccess } from '@vben/access';
import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, message, Modal } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchVoidVipCardsApi,
  countVoidableVipCardsApi,
  getVipCardListApi,
  voidAllVipCardsApi,
  voidVipCardApi,
} from '#/api/manage/vip';
import { confirmWithCountdown } from '#/utils/confirm';

import { useColumns } from './data';
import Form from './modules/form.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: Form,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(null).open();
}

/**
 * 作废单张卡密。
 *
 * 卡密只做作废不做删除：作废后不能再兑换，但记录留在列表里可追溯
 * （已兑换的卡是发放凭据，删掉之后客服再也查不到这笔 VIP 是怎么发的）。
 */
async function onVoid(row: VipManageApi.VipCardInfo) {
  // 二次确认由列里的气泡确认框完成（见 data.ts 的 confirm 配置），
  // 走到这里说明用户已经点过"确定"了
  try {
    await voidVipCardApi(row.id);
    message.success(`VIP卡 ${row.cardCode} 已作废`);
    refreshGrid();
  } catch {
    message.error('作废失败');
  }
}

/** 当前勾选的行 */
function getCheckedRows(): VipManageApi.VipCardInfo[] {
  return gridApi.grid?.getCheckboxRecords?.() ?? [];
}

/** 批量作废：只影响未使用的卡，已使用/已作废的会被服务端跳过 */
async function onBatchVoid() {
  const rows = getCheckedRows();
  if (rows.length === 0) {
    message.warning('请先勾选要作废的卡密');
    return;
  }

  const voidable = rows.filter((row) => row.status === 0).length;
  Modal.confirm({
    title: '批量作废',
    content:
      voidable === rows.length
        ? `确定作废选中的 ${rows.length} 张卡密？作废后不可再兑换，记录仍会保留。`
        : `选中 ${rows.length} 张，其中 ${voidable} 张可作废（其余已使用或已作废，会被跳过）。确定继续？`,
    okText: '确定作废',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      try {
        const result = await batchVoidVipCardsApi(rows.map((row) => row.id));
        message.success(
          result.skippedCount > 0
            ? `已作废 ${result.voidedCount} 张，跳过 ${result.skippedCount} 张`
            : `已作废 ${result.voidedCount} 张`,
        );
        refreshGrid();
      } catch {
        message.error('批量作废失败');
      }
    },
  });
}

/**
 * 全部作废：把库里所有未使用的卡密一次性作废。
 *
 * 先查一次共有多少张再让用户确认——不然点下去不知道会废掉多少。
 */
async function onVoidAll() {
  let count = 0;
  try {
    ({ count } = await countVoidableVipCardsApi());
  } catch {
    message.error('统计可作废数量失败');
    return;
  }

  if (count === 0) {
    message.info('当前没有未使用的卡密');
    return;
  }

  // 范围大且不可撤销，确认按钮加倒计时，避免顺手点确认
  confirmWithCountdown({
    title: '全部作废',
    content: `库里共有 ${count} 张未使用的卡密，将全部作废且不可撤销。已使用的卡不受影响。确定继续？`,
    okText: `确定作废 ${count} 张`,
    countdown: 5,
    onOk: async () => {
      try {
        const result = await voidAllVipCardsApi();
        message.success(`已作废 ${result.voidedCount} 张`);
        refreshGrid();
      } catch {
        message.error('全部作废失败');
      }
    },
  });
}

function onActionClick({
  code,
  row,
}: OnActionClickParams<VipManageApi.VipCardInfo>) {
  switch (code) {
    case 'void': {
      onVoid(row);
      break;
    }
  }
}

const { hasAccessByCodes } = useAccess();
const canCreate = hasAccessByCodes(['vip:create']);
const canVoid = hasAccessByCodes(['vip:delete']);

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'cardCode',
      label: '卡号',
      componentProps: {
        placeholder: '卡号',
      },
    },
    {
      component: 'Input',
      fieldName: 'batchNo',
      label: '批次号',
      componentProps: {
        placeholder: '批次号',
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '使用状态',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: '未使用', value: 0 },
          { label: '已使用', value: 1 },
          { label: '已过期', value: 2 },
          { label: '已作废', value: 3 },
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
    columns: useColumns(onActionClick, canVoid),
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
          return await getVipCardListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            cardCode: formValues.cardCode || undefined,
            batchNo: formValues.batchNo || undefined,
            status:
              formValues.status !== undefined && formValues.status !== ''
                ? Number(formValues.status)
                : undefined,
          });
        },
      },
    },
    rowConfig: { isCurrent: true, isHover: true, keyField: 'id' },
    // 翻页后保留已勾选的行，方便跨页批量操作
    checkboxConfig: { reserve: true, highlight: true, range: true },
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
        <Button v-if="canVoid" class="ml-2" danger @click="onBatchVoid">
          批量作废
        </Button>
        <Button v-if="canVoid" class="ml-2" danger @click="onVoidAll">
          全部作废
        </Button>
      </template>
    </Grid>
  </Page>
</template>
