<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOperationLogListApi } from '#/api/system/operation-log';
import { useColumns, useFormSchema } from './data';

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions: useFormSchema(),
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
          // 处理日期范围
          const params: any = {
            page: page.currentPage,
            pageSize: page.pageSize,
            module: formValues.module || undefined,
            action: formValues.action || undefined,
            method: formValues.method || undefined,
            adminUsername: formValues.adminUsername || undefined,
          };

          // 处理时间范围
          if (formValues.dateRange && Array.isArray(formValues.dateRange)) {
            const [startDate, endDate] = formValues.dateRange;
            if (startDate) {
              params.startDate = startDate.format('YYYY-MM-DD HH:mm:ss');
            }
            if (endDate) {
              params.endDate = endDate.format('YYYY-MM-DD HH:mm:ss');
            }
          }

          return await getOperationLogListApi(params);
        },
      },
    },
    rowConfig: { isCurrent: true, isHover: true },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
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
