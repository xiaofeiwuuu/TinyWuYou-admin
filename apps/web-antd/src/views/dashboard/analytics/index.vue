<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';

import { ref, onMounted, markRaw } from 'vue';
import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
} from '@vben/common-ui';
import {
  createIconifyIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';
import { getOverviewStatisticsApi } from '#/api/dashboard/statistics';

// 收入卡片图标(lucide 图标本项目菜单随处在用,能正常渲染)
const RevenueIcon = createIconifyIcon('lucide:circle-dollar-sign');

import AnalyticsTrends from './analytics-trends.vue';
import AnalyticsVisits from './analytics-visits.vue';
import AnalyticsDownloadsTrends from './analytics-downloads-trends.vue';
import AnalyticsDownloadsMonthly from './analytics-downloads-monthly.vue';
import AnalyticsRevenueTrends from './analytics-revenue-trends.vue';
import AnalyticsRevenueMonthly from './analytics-revenue-monthly.vue';

const overviewItems = ref<AnalysisOverviewItem[]>([
  {
    icon: markRaw(SvgCardIcon),
    title: '用户量',
    totalTitle: '总用户量',
    totalValue: 0,
    value: 0,
  },
  {
    icon: markRaw(SvgCakeIcon),
    title: '图片量',
    totalTitle: '总图片量',
    totalValue: 0,
    value: 0,
  },
  {
    icon: markRaw(SvgDownloadIcon),
    title: '下载量',
    totalTitle: '总下载量',
    totalValue: 0,
    value: 0,
  },
  {
    icon: markRaw(RevenueIcon),
    title: '收入(元)',
    totalTitle: '总收入(元)',
    totalValue: 0,
    value: 0,
  },
]);

// 加载统计数据
async function loadStatistics() {
  try {
    const data = await getOverviewStatisticsApi();
    overviewItems.value = [
      {
        icon: markRaw(SvgCardIcon),
        title: '用户量',
        totalTitle: '总用户量',
        totalValue: data.totalUsers,
        value: data.newUsers,
      },
      {
        icon: markRaw(SvgCakeIcon),
        title: '图片量',
        totalTitle: '总图片量',
        totalValue: data.totalImages,
        value: data.newImages,
      },
      {
        icon: markRaw(SvgDownloadIcon),
        title: '下载量',
        totalTitle: '总下载量',
        totalValue: data.totalDownloads,
        value: data.dailyDownloads,
      },
      {
        icon: markRaw(RevenueIcon),
        title: '收入(元)',
        totalTitle: '总收入(元)',
        totalValue: data.totalRevenue,
        value: data.todayRevenue,
      },
    ];
  } catch (error) {
    console.error('加载统计数据失败:', error);
  }
}

onMounted(() => {
  loadStatistics();
});

const userChartTabs: TabOption[] = [
  {
    label: '用户增长趋势',
    value: 'trends',
  },
  {
    label: '月新增用户',
    value: 'visits',
  },
];

const downloadChartTabs: TabOption[] = [
  {
    label: '下载趋势',
    value: 'downloads-trends',
  },
  {
    label: '月下载统计',
    value: 'downloads-monthly',
  },
];

const revenueChartTabs: TabOption[] = [
  {
    label: '收入趋势',
    value: 'revenue-trends',
  },
  {
    label: '月收入统计',
    value: 'revenue-monthly',
  },
];
</script>

<template>
  <div class="p-5">
    <AnalysisOverview :items="overviewItems" />

    <!-- 用户统计图表 -->
    <AnalysisChartsTabs :tabs="userChartTabs" class="mt-5">
      <template #trends>
        <AnalyticsTrends />
      </template>
      <template #visits>
        <AnalyticsVisits />
      </template>
    </AnalysisChartsTabs>

    <!-- 下载统计图表 -->
    <AnalysisChartsTabs :tabs="downloadChartTabs" class="mt-5">
      <template #downloads-trends>
        <AnalyticsDownloadsTrends />
      </template>
      <template #downloads-monthly>
        <AnalyticsDownloadsMonthly />
      </template>
    </AnalysisChartsTabs>

    <!-- 收入统计图表(来自购买记录) -->
    <AnalysisChartsTabs :tabs="revenueChartTabs" class="mt-5">
      <template #revenue-trends>
        <AnalyticsRevenueTrends />
      </template>
      <template #revenue-monthly>
        <AnalyticsRevenueMonthly />
      </template>
    </AnalysisChartsTabs>
  </div>
</template>
