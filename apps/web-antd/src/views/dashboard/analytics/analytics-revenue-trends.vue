<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getRevenueStatsByDateRangeApi } from '#/api/dashboard/statistics';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 用本地时区格式化日期,和后端按 +08 本地日期分组对齐(不用 toISOString 的 UTC)
const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

async function loadData() {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // 最近30天

    const result = await getRevenueStatsByDateRangeApi(
      formatDate(startDate),
      formatDate(endDate),
    );
    const data = result.map((item) => ({
      date: item.date,
      revenue: item.revenue,
    }));

    // 补齐完整 30 天,缺的日期收入记 0
    const dates: string[] = [];
    const values: number[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = formatDate(date);
      dates.push(dateStr);
      const found = data.find((d) => d.date === dateStr);
      values.push(found ? found.revenue : 0);
    }

    renderEcharts({
      visualMap: {
        show: false,
        type: 'continuous',
        seriesIndex: 0,
        dimension: 0,
        min: 0,
        max: dates.length - 1,
        inRange: {
          color: ['#d1fae5', '#10b981'],
        },
      },
      grid: {
        bottom: '10%',
        containLabel: true,
        left: '3%',
        right: '4%',
        top: '10%',
      },
      legend: {
        data: ['收入(元)'],
        top: '2%',
      },
      series: [
        {
          data: values,
          emphasis: { focus: 'series' },
          markLine: {
            data: [{ type: 'average', name: '平均值' }],
          },
          name: '收入(元)',
          showSymbol: false,
          type: 'line',
          lineStyle: { width: 3 },
          areaStyle: { opacity: 0.08 },
        },
      ],
      tooltip: {
        axisPointer: {
          type: 'cross',
          label: { backgroundColor: '#6a7985' },
        },
        trigger: 'axis',
        valueFormatter: (v: any) => `¥${Number(v).toFixed(2)}`,
      },
      xAxis: {
        axisTick: { show: false },
        boundaryGap: false,
        data: dates.map((d) => d.slice(5)), // MM-DD
        type: 'category',
      },
      yAxis: {
        axisTick: { show: false },
        axisLabel: {
          color: '#999',
          formatter: (v: number) => `¥${v}`,
        },
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#eee' } },
        type: 'value',
      },
    });
  } catch (error) {
    console.error('加载收入趋势数据失败:', error);
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <div>
    <EchartsUI ref="chartRef" />
  </div>
</template>
