<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { onMounted, ref } from 'vue';
import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { getUserStatsByMonthApi, getVipStatsByMonthApi } from '#/api/dashboard/statistics';

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// 加载数据并渲染图表
async function loadData() {
  try {
    const currentYear = new Date().getFullYear();

    // 同时获取所有用户和VIP用户数据
    const [allUsersResult, vipUsersResult] = await Promise.all([
      getUserStatsByMonthApi(currentYear),
      getVipStatsByMonthApi(currentYear)
    ]);

    const allUsersData = allUsersResult.map(item => ({ month: item.month, count: item.newUsers }));
    const vipUsersData = vipUsersResult.map(item => ({ month: item.month, count: item.newVips }));

    // 生成完整的12个月列表
    const months: string[] = [];
    const allUsersCounts: number[] = [];
    const vipUsersCounts: number[] = [];

    for (let i = 1; i <= 12; i++) {
      const monthStr = `${currentYear}-${i.toString().padStart(2, '0')}`;
      months.push(`${i}月`);

      // 查找对应月份的数据
      const foundAll = allUsersData.find(d => d.month === monthStr);
      const foundVip = vipUsersData.find(d => d.month === monthStr);

      allUsersCounts.push(foundAll ? foundAll.count : 0);
      vipUsersCounts.push(foundVip ? foundVip.count : 0);
    }

    // 准备饼图数据 - 分别显示普通用户和VIP用户的月度分布
    const allUsersPieData = months.map((month, index) => ({
      name: month,
      value: allUsersCounts[index]
    })).filter(item => item.value > 0);

    const vipUsersPieData = months.map((month, index) => ({
      name: month,
      value: vipUsersCounts[index]
    })).filter(item => item.value > 0);

    renderEcharts({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
      },
      legend: {
        data: ['新增用户', '新增VIP', '用户月度分布', 'VIP月度分布'],
        top: '2%',
      },
      grid: {
        left: '3%',
        right: '55%',
        bottom: '10%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: months,
        axisTick: {
          show: false,
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
      },
      series: [
        {
          name: '新增用户',
          type: 'bar',
          barMaxWidth: 30,
          barGap: '20%',
          data: allUsersCounts,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#4a64f1' },
                { offset: 1, color: '#e1eaff' },
              ],
            },
          },
        },
        {
          name: '新增VIP',
          type: 'bar',
          barMaxWidth: 30,
          data: vipUsersCounts,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#f39c12' },
                { offset: 1, color: '#fff4e6' },
              ],
            },
          },
        },
        {
          name: '用户月度分布',
          type: 'pie',
          radius: ['25%', '55%'],
          center: ['60%', '50%'],
          roseType: 'area',
          itemStyle: {
            borderRadius: 8,
            color: (params: any) => {
              const colors = ['#4a64f1', '#5a74f3', '#6a84f5', '#7a94f7', '#8aa4f9'];
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            fontSize: 10,
            formatter: '{b}: {c}'
          },
          tooltip: {
            formatter: '{b}: {c} 人 ({d}%)'
          },
          data: allUsersPieData
        },
        {
          name: 'VIP月度分布',
          type: 'pie',
          radius: ['25%', '55%'],
          center: ['85%', '50%'],
          roseType: 'area',
          itemStyle: {
            borderRadius: 8,
            color: (params: any) => {
              const colors = ['#f39c12', '#f5a623', '#f7b034', '#f9ba45', '#fbc456'];
              return colors[params.dataIndex % colors.length];
            }
          },
          label: {
            show: true,
            fontSize: 10,
            formatter: '{b}: {c}'
          },
          tooltip: {
            formatter: '{b}: {c} 人 ({d}%)'
          },
          data: vipUsersPieData
        }
      ]
    });
  } catch (error) {
    console.error('加载用户月统计数据失败:', error);
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
