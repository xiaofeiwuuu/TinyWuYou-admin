<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserListApi, type UserManageApi } from '#/api/manage/user';
import { getUserVipListApi } from '#/api/manage/user-vip';

import { getSourceTypeOptions, useColumns } from './data';

// 两个独立的远程搜索：用户名按 nickname 联想、UID 按 uid 联想
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

const formOptions: VbenFormProps = {
  collapsed: false,
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
    {
      component: 'Input',
      fieldName: 'cardCode',
      label: '卡号',
      componentProps: {
        placeholder: '卡号',
      },
    },
    {
      component: 'Select',
      fieldName: 'sourceType',
      label: '开通方式',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: getSourceTypeOptions().map(({ label, value }) => ({
          label,
          value,
        })),
      },
    },
    {
      component: 'RangePicker',
      fieldName: 'dateRange',
      label: '兑换时间',
      componentProps: {
        valueFormat: 'YYYY-MM-DD',
      },
    },
  ],
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    columns: useColumns(),
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
          // RangePicker 给的是 [开始, 结束] 数组，拆成两个查询参数
          const [startDate, endDate] = formValues.dateRange ?? [];

          return await getUserVipListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            nickname: formValues.nickname || undefined,
            uid: formValues.uid ? String(formValues.uid).trim() : undefined,
            cardCode: formValues.cardCode || undefined,
            sourceType: formValues.sourceType || undefined,
            startDate: startDate || undefined,
            endDate: endDate || undefined,
          });
        },
      },
    },
    rowConfig: { isCurrent: true, isHover: true, keyField: 'id' },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="VIP开通记录" />
  </Page>
</template>
