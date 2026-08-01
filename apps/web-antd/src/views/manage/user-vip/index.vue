<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getUserVipListApi } from '#/api/manage/user-vip';

import { getSourceTypeOptions, useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'userKeyword',
      label: '用户',
      componentProps: {
        placeholder: '昵称或 openid',
      },
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
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
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
            userKeyword: formValues.userKeyword || undefined,
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
