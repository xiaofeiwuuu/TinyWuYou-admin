<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOperationLogListApi } from '#/api/system/operation-log';
import { useColumns } from './data';

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(),
    height: 'auto',
    proxyConfig: {
      response: {
        result: 'list',
        total: 'total',
      },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getOperationLogListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            ...formValues,
          });
        },
      },
    },
  },
  gridEvents: {},
});
</script>

<template>
  <Page
    auto-content-height
    description="记录所有管理员的操作行为,包括增删改查等操作"
    title="操作日志"
  >
    <Grid>
      <template #toolbar-tools>
        <span class="text-foreground/80 text-sm">
          自动记录所有后台操作,日志保留90天
        </span>
      </template>
    </Grid>
  </Page>
</template>
