<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { getDownloadStatsByMonthApi } from '#/api/dashboard/statistics';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 加载数据并渲染图表
async function loadData() {
  try {
    const currentYear = new Date().getFullYear();

    const result = await getDownloadStatsByMonthApi(currentYear);
    const data = result.map(item => ({ month: item.month, count: item.downloads }));

    // 生成完整的12个月列表
    const months: string[] = [];
    const counts: number[] = [];
    for (let i = 1; i <= 12; i++) {
      const monthStr = `${currentYear}-${i.toString().padStart(2, '0')}`;
      months.push(`${i}月`);

      // 查找对应月份的数据
      const found = data.find(d => d.month === monthStr);
      counts.push(found ? found.count : 0);
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
        data: ['下载次数'],
        top: '5%',
      },
      series: [
        {
          barMaxWidth: 60,
          data: counts,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#ff9800' },
                { offset: 1, color: '#f57c00' },
              ],
            },
          },
          name: '下载次数',
          type: 'bar',
        },
      ],
      tooltip: {
        axisPointer: {
          lineStyle: {
            color: '#ff9800',
            width: 1,
          },
        },
        formatter: (params: any) => {
          const param = params[0];
          return `${param.name}<br/>${param.seriesName}: ${param.value}`;
        },
        trigger: 'axis',
      },
      xAxis: {
        axisTick: {
          show: false,
        },
        data: months,
        type: 'category',
      },
      yAxis: {
        minInterval: 1,
        splitNumber: 5,
        type: 'value',
      },
    });
  } catch (error) {
    console.error('加载下载月统计数据失败:', error);
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
