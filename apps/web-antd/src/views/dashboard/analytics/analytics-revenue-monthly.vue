<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { getRevenueStatsByMonthApi } from '#/api/dashboard/statistics';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

async function loadData() {
  try {
    const currentYear = new Date().getFullYear();

    const result = await getRevenueStatsByMonthApi(currentYear);
    const data = result.map((item) => ({
      month: item.month,
      revenue: item.revenue,
    }));

    // 补齐 12 个月
    const months: string[] = [];
    const values: number[] = [];
    for (let i = 1; i <= 12; i++) {
      const monthStr = `${currentYear}-${i.toString().padStart(2, '0')}`;
      months.push(`${i}月`);
      const found = data.find((d) => d.month === monthStr);
      values.push(found ? found.revenue : 0);
    }

    renderEcharts({
      grid: {
        bottom: '10%',
        containLabel: true,
        left: '3%',
        right: '4%',
        top: '15%',
      },
      legend: {
        data: ['收入(元)'],
        top: '5%',
      },
      series: [
        {
          barMaxWidth: 60,
          data: values,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#34d399' },
                { offset: 1, color: '#059669' },
              ],
            },
          },
          name: '收入(元)',
          type: 'bar',
        },
      ],
      tooltip: {
        axisPointer: {
          lineStyle: { color: '#10b981', width: 1 },
        },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>${param.seriesName}: ¥${Number(param.value).toFixed(2)}`;
        },
        trigger: 'axis',
      },
      xAxis: {
        axisTick: { show: false },
        data: months,
        type: 'category',
      },
      yAxis: {
        splitNumber: 5,
        axisLabel: {
          formatter: (v: number) => `¥${v}`,
        },
        type: 'value',
      },
    });
  } catch (error) {
    console.error('加载收入月统计数据失败:', error);
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
