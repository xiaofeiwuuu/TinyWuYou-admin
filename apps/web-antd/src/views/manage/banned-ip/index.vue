<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BannedIpApi } from '#/api/manage/banned-ip';

import { reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Button as AButton,
  Input as AInput,
  InputNumber as AInputNumber,
  message,
  Modal as AModal,
  Popconfirm,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { banIpApi, getBannedIpListApi, unbanIpApi } from '#/api/manage/banned-ip';

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { field: 'ip', title: 'IP', minWidth: 150 },
      {
        field: 'type',
        title: '来源',
        width: 90,
        formatter: ({ cellValue }) => (cellValue === 'auto' ? '自动' : '手动'),
      },
      { field: 'reason', title: '原因', minWidth: 200, showOverflow: 'tooltip' },
      {
        field: 'expiresAt',
        title: '到期',
        width: 170,
        formatter: ({ cellValue }) => (cellValue ? formatDateTime(cellValue) : '永久'),
      },
      {
        field: 'active',
        title: '状态',
        width: 90,
        formatter: ({ cellValue }) => (cellValue ? '生效中' : '已过期'),
      },
      { field: 'operator', title: '操作者', width: 110 },
      {
        field: 'createdAt',
        title: '封禁时间',
        width: 170,
        formatter: ({ cellValue }) => (cellValue ? formatDateTime(cellValue) : '-'),
      },
      { field: 'action', title: '操作', width: 100, fixed: 'right', slots: { default: 'action' } },
    ],
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    stripe: true,
    proxyConfig: {
      response: { result: 'list', total: 'total' },
      ajax: {
        query: async ({ page }) => {
          return await getBannedIpListApi({
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

// —— 手动封禁弹窗 ——
const modalOpen = ref(false);
const saving = ref(false);
const form = reactive<{ ip: string; reason: string; ttlHours: number | null }>({
  ip: '',
  reason: '',
  ttlHours: null,
});

function openBan() {
  form.ip = '';
  form.reason = '';
  form.ttlHours = null;
  modalOpen.value = true;
}

async function submitBan() {
  if (!form.ip.trim()) {
    message.warning('请输入 IP');
    return;
  }
  saving.value = true;
  try {
    await banIpApi({
      ip: form.ip.trim(),
      reason: form.reason.trim() || undefined,
      ttlHours: form.ttlHours ?? 0,
    });
    message.success('已封禁');
    modalOpen.value = false;
    gridApi.query();
  } catch (error: any) {
    message.error(error?.message || '封禁失败');
  } finally {
    saving.value = false;
  }
}

async function onUnban(row: BannedIpApi.Item) {
  try {
    await unbanIpApi(row.id);
    message.success('已解封');
    gridApi.query();
  } catch (error: any) {
    message.error(error?.message || '解封失败');
  }
}
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="IP 封禁">
      <template #toolbar-tools>
        <span class="mr-3 hidden text-xs text-gray-400 lg:inline">
          小程序端签名失败达阈值的 IP 会自动封禁;也可手动封禁 / 解封
        </span>
        <AButton type="primary" @click="openBan">手动封禁</AButton>
      </template>

      <template #action="{ row }">
        <Popconfirm title="确定解封该 IP?" @confirm="onUnban(row)">
          <AButton type="link" danger size="small">解封</AButton>
        </Popconfirm>
      </template>
    </Grid>

    <AModal
      v-model:open="modalOpen"
      title="手动封禁 IP"
      :confirm-loading="saving"
      @ok="submitBan"
    >
      <div class="flex flex-col gap-3 py-2">
        <div>
          <div class="mb-1 text-sm">IP 地址</div>
          <AInput v-model:value="form.ip" placeholder="如 1.2.3.4" />
        </div>
        <div>
          <div class="mb-1 text-sm">封禁原因(可选)</div>
          <AInput v-model:value="form.reason" placeholder="备注,便于日后核对" />
        </div>
        <div>
          <div class="mb-1 text-sm">封禁时长(小时,留空或 0 = 永久)</div>
          <AInputNumber v-model:value="form.ttlHours" :min="0" :max="8760" class="w-full" />
        </div>
      </div>
    </AModal>
  </Page>
</template>
