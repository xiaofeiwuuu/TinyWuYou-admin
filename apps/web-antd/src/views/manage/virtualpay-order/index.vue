<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getVirtualOrderListApi } from '#/api/manage/virtualpay';

const statusText: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  delivered: '已发货',
  failed: '失败',
};

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-2 md:grid-cols-3',
  schema: [
    {
      component: 'Input',
      fieldName: 'uid',
      label: '会员UID',
      componentProps: { placeholder: '精确匹配 UID' },
    },
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索会员',
      componentProps: { placeholder: '昵称 / UID 模糊搜索' },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    columns: [
      { title: 'UID', field: 'uid', width: 110 },
      { title: '昵称', field: 'nickname', minWidth: 120 },
      { title: '订单号', field: 'outTradeNo', minWidth: 180 },
      {
        title: '类型',
        field: 'productType',
        width: 100,
        formatter: ({ cellValue }) => (cellValue === 'vip' ? 'VIP会员' : '下载次数'),
      },
      { title: '商品ID', field: 'productId', width: 110 },
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
    stripe: true,
    proxyConfig: {
      response: { result: 'list', total: 'total' },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getVirtualOrderListApi({
            uid: formValues.uid ? String(formValues.uid).trim() : undefined,
            keyword: formValues.keyword || undefined,
            page: page.currentPage,
            pageSize: page.pageSize,
          });
        },
      },
    },
    rowConfig: { isHover: true },
    toolbarConfig: { refresh: true, zoom: true },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="购买记录" />
  </Page>
</template>
