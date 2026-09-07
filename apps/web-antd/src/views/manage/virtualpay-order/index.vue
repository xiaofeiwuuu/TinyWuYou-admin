<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { VirtualPayApi } from '#/api/manage/virtualpay';

import { h, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Modal, message } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserListApi, type UserManageApi } from '#/api/manage/user';
import {
  getVirtualOrderListApi,
  refundVirtualOrderApi,
} from '#/api/manage/virtualpay';
import UserInfoModal from '#/views/manage/user/modules/user-info.vue';

// UID 列点击弹出的用户信息弹窗
const userInfoRef = ref<InstanceType<typeof UserInfoModal>>();
function handleUidClick(uid: string) {
  if (uid) userInfoRef.value?.open(uid);
}

// 两个独立远程搜索：用户名按 nickname 联想、UID 按 uid 联想
const nameOptions = ref<{ label: string; value: string }[]>([]);
const uidOptions = ref<{ label: string; value: string }[]>([]);
let nameTimer: any;
let uidTimer: any;

const handleNameSearch = (kw: string) => {
  clearTimeout(nameTimer);
  const key = (kw || '').trim();
  if (!key) {
    nameOptions.value = [];
    return;
  }
  nameTimer = setTimeout(async () => {
    try {
      const res = await getUserListApi({ nickname: key, page: 1, pageSize: 20 });
      nameOptions.value = (res.list || []).map((u: UserManageApi.UserInfo) => ({
        label: `${u.nickname || '(无昵称)'} · ${u.uid}`,
        value: u.nickname || '',
      }));
    } catch {
      nameOptions.value = [];
    }
  }, 300);
};

const handleUidSearch = (kw: string) => {
  clearTimeout(uidTimer);
  const key = (kw || '').trim();
  if (!key) {
    uidOptions.value = [];
    return;
  }
  uidTimer = setTimeout(async () => {
    try {
      const res = await getUserListApi({ uid: key, page: 1, pageSize: 20 });
      uidOptions.value = (res.list || []).map((u: UserManageApi.UserInfo) => ({
        label: `${u.uid} · ${u.nickname || '(无昵称)'}`,
        value: u.uid,
      }));
    } catch {
      uidOptions.value = [];
    }
  }, 300);
};

const statusText: Record<string, string> = {
  pending: '待支付',
  paid: '已支付',
  delivered: '已发货',
  failed: '失败',
  refunded: '已退款',
};

// 主动退款（仅已发货订单）
function handleRefund(row: VirtualPayApi.OrderInfo) {
  Modal.confirm({
    title: '确认退款',
    content: `确定给会员「${row.nickname || row.uid}」的订单 ${row.outTradeNo} 退款吗？退款成功会自动撤销对应权益。\n\n注意：iOS 订单无法由后台主动退款（需用户向 App Store 申请）。`,
    okText: '发起退款',
    okType: 'danger',
    async onOk() {
      try {
        await refundVirtualOrderApi(row.outTradeNo);
        message.success('退款已受理');
        gridApi.query();
      } catch (error: any) {
        message.error(error?.message || '退款失败');
      }
    },
  });
}

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-2 md:grid-cols-5',
  schema: [
    {
      component: 'Select',
      fieldName: 'nickname',
      label: '用户名',
      componentProps: () => ({
        allowClear: true,
        filterOption: false,
        notFoundContent: null,
        onSearch: handleNameSearch,
        options: nameOptions.value,
        placeholder: '输入用户名远程搜索',
        showSearch: true,
      }),
    },
    {
      component: 'Select',
      fieldName: 'uid',
      label: 'UID',
      componentProps: () => ({
        allowClear: true,
        filterOption: false,
        notFoundContent: null,
        onSearch: handleUidSearch,
        options: uidOptions.value,
        placeholder: '输入 UID 远程搜索',
        showSearch: true,
      }),
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    columns: [
      {
        title: 'UID',
        field: 'uid',
        width: 110,
        slots: {
          default: ({ row }: { row: VirtualPayApi.OrderInfo }) =>
            row.uid
              ? h(
                  'span',
                  {
                    class: 'cursor-pointer font-mono text-blue-600 hover:underline',
                    title: '点击查看用户信息',
                    onClick: () => handleUidClick(row.uid),
                  },
                  row.uid,
                )
              : h('span', { style: { color: '#999' } }, '—'),
        },
      },
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
      {
        title: '操作',
        width: 90,
        fixed: 'right',
        slots: {
          default: ({ row }: { row: VirtualPayApi.OrderInfo }) =>
            row.status === 'delivered'
              ? h(
                  'a',
                  {
                    style: { color: '#ff4d4f' },
                    onClick: () => handleRefund(row),
                  },
                  '退款',
                )
              : h('span', { style: { color: '#999' } }, '—'),
        },
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
            nickname: formValues.nickname || undefined,
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
    <UserInfoModal ref="userInfoRef" />
  </Page>
</template>
