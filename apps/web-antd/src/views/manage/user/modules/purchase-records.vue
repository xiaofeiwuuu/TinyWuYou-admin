<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getVirtualOrderListApi } from '#/api/manage/virtualpay';

const currentUserId = ref<number>();

const statusText: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  delivered: '已发货',
  failed: '失败',
};

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: [
      { title: '订单号', field: 'outTradeNo', minWidth: 180 },
      {
        title: '类型',
        field: 'productType',
        width: 100,
        formatter: ({ cellValue }) => (cellValue === 'vip' ? 'VIP会员' : '下载次数'),
      },
      { title: '商品ID', field: 'productId', width: 120 },
      { title: '数量', field: 'amount', width: 80 },
      {
        title: '金额',
        field: 'price',
        width: 100,
        formatter: ({ cellValue }) => `¥${(Number(cellValue) / 100).toFixed(2)}`,
      },
      {
        title: '状态',
        field: 'status',
        width: 90,
        formatter: ({ cellValue }) => statusText[cellValue] ?? cellValue,
      },
      {
        title: '平台单号',
        field: 'wxOrderId',
        minWidth: 160,
        showOverflow: true,
        formatter: ({ cellValue }) => cellValue || '—',
      },
      {
        title: '下单时间',
        field: 'createdAt',
        width: 170,
        formatter: ({ cellValue }) => (cellValue ? formatDateTime(cellValue) : ''),
      },
      {
        title: '发货时间',
        field: 'deliveredAt',
        width: 170,
        formatter: ({ cellValue }) => (cellValue ? formatDateTime(cellValue) : '—'),
      },
    ],
    height: 'auto',
    keepSource: true,
    pagerConfig: { enabled: true },
    proxyConfig: {
      response: { result: 'list', total: 'total' },
      ajax: {
        query: async ({ page }) => {
          if (!currentUserId.value) return { list: [], total: 0 };
          return await getVirtualOrderListApi({
            userId: currentUserId.value,
            page: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: { isHover: true },
    toolbarConfig: { refresh: true },
  } as VxeTableGridOptions,
});

const [Modal, modalApi] = useVbenModal({
  footer: false,
  onOpenChange(isOpen) {
    if (isOpen) gridApi.query();
  },
});

function open(userId: number) {
  currentUserId.value = userId;
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal class="w-[960px]" title="购买记录">
    <Grid />
  </Modal>
</template>
