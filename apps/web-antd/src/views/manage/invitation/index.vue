<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { VbenFormProps } from '#/adapter/form';

import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInvitationListApi } from '#/api/manage/invitation';

import { useColumns } from './data';

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Input',
      fieldName: 'inviterKeyword',
      label: '邀请者',
      componentProps: {
        placeholder: '昵称',
      },
    },
    {
      component: 'Input',
      fieldName: 'inviteeKeyword',
      label: '被邀请者',
      componentProps: {
        placeholder: '昵称',
      },
    },
  ],
  wrapperClass: 'grid-cols-5',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const [Grid, gridApi] = useVbenVxeGrid({
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
          return await getInvitationListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            inviterKeyword: formValues.inviterKeyword || undefined,
            inviteeKeyword: formValues.inviteeKeyword || undefined,
          });
        },
      },
    },
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
    <Grid table-title="邀请记录" />
  </Page>
</template>
