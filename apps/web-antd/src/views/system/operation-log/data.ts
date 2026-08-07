import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormProps } from '#/adapter/form';
import type { OperationLogApi } from '#/api/system/operation-log';

import { reactive, ref } from 'vue';

import dayjs from 'dayjs';

import { getOperationLogFiltersApi } from '#/api/system/operation-log';

export function getActionOptions() {
  return [
    { color: 'blue', label: '查询', value: 'query' },
    { color: 'green', label: '创建', value: 'create' },
    { color: 'orange', label: '更新', value: 'update' },
    { color: 'red', label: '删除', value: 'delete' },
  ];
}

/** 状态码配色：2xx 成功、4xx 客户端错误、5xx 服务端错误 */
export function statusCodeColor(code: number): string {
  if (code >= 200 && code < 300) return 'green';
  if (code >= 300 && code < 400) return 'blue';
  if (code >= 400 && code < 500) return 'orange';
  if (code >= 500) return 'red';
  return 'default';
}

/** 标签配色仍按底层动作分，颜色语义不变（绿=新增 橙=修改 红=删除） */
const ACTION_COLORS: Record<string, string> = {
  create: 'green',
  delete: 'red',
  query: 'blue',
  update: 'orange',
};

/**
 * 筛选下拉项。中文名由后端字典给出，页面挂载时拉一次填进来。
 * 原地填充而不是重新赋值，配合函数形式的 componentProps 才能自动刷新。
 */
export const MODULE_OPTIONS: Array<{ label: string; value: string }> =
  reactive([]);
export const ADMIN_OPTIONS: Array<{ label: string; value: string }> = reactive(
  [],
);

export async function loadFilterOptions() {
  const { admins, modules } = await getOperationLogFiltersApi();
  MODULE_OPTIONS.length = 0;
  MODULE_OPTIONS.push(...modules);
  ADMIN_OPTIONS.length = 0;
  ADMIN_OPTIONS.push(...admins);
}

/**
 * 打开日期面板时自增，用来强制重算快捷选项。
 *
 * ant-design-vue 4.2.6 的 PresetPanel 是 `props.onClick(value)` 直接把 value 抛出去，
 * 不支持函数形式的 value（传函数进去会被当成日期范围，点了没反应），
 * 所以只能传算好的具体时间。但那样又会被 computed 缓存住——
 * 页面开着两小时后，"近1小时"还停在打开页面那一刻。
 * 这个 tick 就是让 computed 有个可变依赖，每次开面板重算一次。
 */
const presetsTick = ref(0);

/** 时间范围快捷选项 */
function rangePresets() {
  const now = dayjs();
  return [
    { label: '近1小时', value: [now.subtract(1, 'hour'), now] },
    { label: '近3小时', value: [now.subtract(3, 'hour'), now] },
    { label: '近6小时', value: [now.subtract(6, 'hour'), now] },
    { label: '近12小时', value: [now.subtract(12, 'hour'), now] },
    { label: '近1天', value: [now.subtract(1, 'day'), now] },
    { label: '近3天', value: [now.subtract(3, 'day'), now] },
  ];
}

export function getMethodOptions() {
  return [
    { color: 'blue', label: 'GET', value: 'GET' },
    { color: 'green', label: 'POST', value: 'POST' },
    { color: 'orange', label: 'PUT', value: 'PUT' },
    { color: 'purple', label: 'PATCH', value: 'PATCH' },
    { color: 'red', label: 'DELETE', value: 'DELETE' },
  ];
}

export function useFormSchema(): VbenFormProps {
  return {
    collapsed: false,
    wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-6',
    schema: [
      {
        component: 'Select',
        fieldName: 'module',
        label: '模块',
        // 函数形式：选项是异步拉回来的，快照写法会停在空数组上
        componentProps: () => ({
          allowClear: true,
          placeholder: '全部',
          dropdownMatchSelectWidth: false,
          options: MODULE_OPTIONS,
        }),
      },
      {
        component: 'Select',
        fieldName: 'action',
        label: '操作类型',
        componentProps: {
          allowClear: true,
          placeholder: '全部',
          dropdownMatchSelectWidth: false,
          options: getActionOptions().map((item) => ({
            label: item.label,
            value: item.value,
          })),
        },
      },
      {
        component: 'Select',
        fieldName: 'method',
        label: '请求方法',
        componentProps: {
          allowClear: true,
          placeholder: '全部',
          dropdownMatchSelectWidth: false,
          options: getMethodOptions().map((item) => ({
            label: item.label,
            value: item.value,
          })),
        },
      },
      {
        component: 'Select',
        fieldName: 'adminUsername',
        label: '管理员',
        // 函数形式：选项是异步拉回来的，快照写法会停在空数组上
        componentProps: () => ({
          allowClear: true,
          placeholder: '全部',
          dropdownMatchSelectWidth: false,
          // 管理员可能很多，给个搜索框
          showSearch: true,
          optionFilterProp: 'label',
          options: ADMIN_OPTIONS,
        }),
      },
      {
        component: 'RangePicker',
        fieldName: 'dateRange',
        label: '时间范围',
        formItemClass: 'col-span-2 md:col-span-2 xl:col-span-2',
        componentProps: () => ({
          showTime: true,
          format: 'YYYY-MM-DD HH:mm:ss',
          placeholder: ['开始时间', '结束时间'],
          // 读一下 tick，让这个 computed 依赖它，开面板时才会重算出新的时间
          presets: (presetsTick.value, rangePresets()),
          onOpenChange: (open: boolean) => {
            if (open) presetsTick.value += 1;
          },
        }),
      },
    ],
    showCollapseButton: false,
    submitOnChange: false,
    submitOnEnter: true,
  };
}

export function useColumns(): VxeTableGridOptions<OperationLogApi.OperationLogInfo>['columns'] {
  return [
    { title: '序号', type: 'seq', width: 50 },
    {
      title: '管理员',
      field: 'adminUsername',
      minWidth: 120,
    },
    {
      title: '模块',
      field: 'moduleLabel',
      width: 120,
      formatter: ({ row }) => row.moduleLabel || row.module || '-',
    },
    {
      title: '操作',
      field: 'actionLabel',
      width: 110,
      // 显示按路由语义判断出来的操作名。原来直接把 HTTP 方法翻译成
      // 创建/更新，导致「批量作废」被记成「创建」这种误导。
      cellRender: { name: 'CellTag' },
      formatter: ({ row }) => ({
        color: ACTION_COLORS[row.action] ?? 'default',
        content: row.actionLabel || row.action || '-',
      }),
    },
    {
      title: '方法',
      field: 'method',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: getMethodOptions(),
      },
    },
    {
      title: '请求路径',
      field: 'path',
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: 'IP地址',
      field: 'ip',
      width: 140,
    },
    {
      title: '状态码',
      field: 'statusCode',
      width: 100,
      // 用插槽而不是 CellTag：CellTag 是拿单元格值去 options 里查颜色的，
      // 根本不看 formatter 的返回值，所以原来那套按区间返回颜色的写法从未生效，
      // 状态码全都渲染成默认的灰色标签。状态码是连续值，也不适合枚举成 options。
      slots: { default: 'statusCode' },
    },
    {
      title: '耗时(ms)',
      field: 'duration',
      width: 100,
      formatter: ({ row }) => {
        const ms = row.duration;
        if (ms > 1000) {
          return `${(ms / 1000).toFixed(2)}s`;
        }
        return `${ms}ms`;
      },
    },
    {
      title: '操作时间',
      field: 'createdAt',
      width: 180,
      formatter: ({ cellValue }) =>
        cellValue ? dayjs(cellValue).format('YYYY-MM-DD HH:mm:ss') : '-',
    },
    {
      title: '请求参数',
      field: 'params',
      width: 200,
      showOverflow: true,
      formatter: ({ cellValue }) => {
        if (!cellValue || cellValue === '{}') return '-';
        try {
          const params = JSON.parse(cellValue);
          return JSON.stringify(params, null, 2);
        } catch {
          return cellValue;
        }
      },
    },
    {
      // 备注和错误信息在库里是分开的两列（备注每条都有，错误只有失败才有，
      // 分开存才能单独筛失败记录），但展示上合成一列，避免一整列都是 '-'
      title: '备注',
      field: 'remark',
      minWidth: 240,
      showOverflow: true,
      slots: { default: 'remark' },
    },
  ];
}
