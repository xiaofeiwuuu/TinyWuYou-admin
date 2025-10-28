<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { getDownloadStatsByDateRangeApi } from '#/api/dashboard/statistics';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 加载数据并渲染图表
async function loadData() {
  try {
    // 获取最近30天的日期范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 29); // 最近30天

    const formatDate = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    const start = formatDate(startDate);
    const end = formatDate(endDate);

    const result = await getDownloadStatsByDateRangeApi(start, end);

    // 调试日志:查看 API 返回的原始数据
    console.log('下载趋势 API 返回数据:', result);
    console.log('日期范围:', { start, end });

    const data = result.map(item => ({ date: item.date, count: item.downloads }));

    // 生成完整的30天日期列表
    const dates: string[] = [];
    const counts: number[] = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = formatDate(date);
      dates.push(dateStr);

      // 查找对应日期的数据
      const found = data.find(d => d.date === dateStr);
      counts.push(found ? found.count : 0);
    }

    console.log('处理后的数据:', { dates, counts });
    console.log('数据总数:', counts.reduce((a, b) => a + b, 0));

    renderEcharts({
      visualMap: {
        show: false,
        type: 'continuous',
        seriesIndex: 0,
        dimension: 0,  // x 轴渐变
        min: 0,
        max: dates.length - 1,
        inRange: {
          color: ['#ffe5e5', '#ff6b6b']
        }
      },
      grid: {
        bottom: '10%',
        containLabel: true,
        left: '3%',
        right: '4%',
        top: '10%',
      },
      legend: {
        data: ['下载次数'],
        top: '2%',
      },
      series: [
        {
          data: counts,
          emphasis: {
            focus: 'series',
          },
          markLine: {
            data: [{ type: 'average', name: '平均值' }],
          },
          name: '下载次数',
          showSymbol: false,
          type: 'line',
          lineStyle: {
            width: 3
          }
        },
      ],
      tooltip: {
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985',
          },
        },
        trigger: 'axis',
      },
      xAxis: {
        axisTick: {
          show: false,
        },
        boundaryGap: false,
        data: dates.map(d => d.substring(5)), // 显示 MM-DD
        type: 'category',
      },
      yAxis: {
        axisTick: {
          show: false,
        },
        axisLabel: {
          color: '#999',
        },
        axisLine: {
          show: false,
        },
        minInterval: 1,
        splitLine: {
          lineStyle: {
            color: '#eee',
          },
        },
        type: 'value',
      },
    });
  } catch (error) {
    console.error('加载下载趋势数据失败:', error);
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
