<script lang="ts" setup>
import { onMounted } from 'vue';

import { Page } from '@vben/common-ui';

import { Tag } from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getOperationLogListApi } from '#/api/system/operation-log';

import {
  loadFilterOptions,
  statusCodeColor,
  useColumns,
  useFormSchema,
} from './data';

const [Grid] = useVbenVxeGrid({
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

          // 时间范围传 ISO 时间戳，不传 'YYYY-MM-DD HH:mm:ss' 墙钟字符串。
          // 墙钟字符串没有时区信息，MySQL 会按它自己的会话时区(+08)去解释，
          // 浏览器所在时区一旦不是 +08，筛选窗口就会整体偏移。
          if (formValues.dateRange && Array.isArray(formValues.dateRange)) {
            const [startDate, endDate] = formValues.dateRange;
            if (startDate) {
              params.startDate = startDate.toISOString();
            }
            if (endDate) {
              params.endDate = endDate.toISOString();
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

// 模块 / 管理员筛选项来自后端字典
onMounted(() => {
  loadFilterOptions();
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
          仅记录增删改操作,查询不记录;日志保留90天
        </span>
      </template>
      <!-- 状态码：按 2xx/4xx/5xx 上色 -->
      <template #statusCode="{ row }">
        <Tag :color="statusCodeColor(row.statusCode)">{{ row.statusCode }}</Tag>
      </template>
      <!-- 备注列：正常显示操作说明，失败时在下面用红字追加错误原因 -->
      <template #remark="{ row }">
        <div class="leading-tight">
          <div>{{ row.remark || '-' }}</div>
          <div v-if="row.errorMessage" class="text-destructive mt-0.5 text-xs">
            {{ row.errorMessage }}
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
