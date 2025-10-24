import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormProps } from '#/adapter/form';
import type { OperationLogApi } from '#/api/system/operation-log';

export function getActionOptions() {
  return [
    { color: 'blue', label: '查询', value: 'query' },
    { color: 'green', label: '创建', value: 'create' },
    { color: 'orange', label: '更新', value: 'update' },
    { color: 'red', label: '删除', value: 'delete' },
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
        component: 'Input',
        fieldName: 'module',
        label: '模块',
        componentProps: {
          placeholder: '模块名称',
        },
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
        component: 'Input',
        fieldName: 'adminUsername',
        label: '管理员',
        componentProps: {
          placeholder: '管理员用户名',
        },
      },
      {
        component: 'RangePicker',
        fieldName: 'dateRange',
        label: '时间范围',
        formItemClass: 'col-span-2 md:col-span-2 xl:col-span-2',
        componentProps: {
          showTime: true,
          format: 'YYYY-MM-DD HH:mm:ss',
          placeholder: ['开始时间', '结束时间'],
        },
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
      field: 'module',
      width: 120,
    },
    {
      title: '操作',
      field: 'action',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: getActionOptions(),
      },
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
      cellRender: {
        name: 'CellTag',
      },
      formatter: ({ row }) => {
        const code = row.statusCode;
        if (code >= 200 && code < 300) {
          return { content: code.toString(), color: 'green' };
        } else if (code >= 400 && code < 500) {
          return { content: code.toString(), color: 'orange' };
        } else if (code >= 500) {
          return { content: code.toString(), color: 'red' };
        }
        return { content: code.toString(), color: 'default' };
      },
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
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
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
      title: '错误信息',
      field: 'errorMessage',
      minWidth: 200,
      showOverflow: true,
      formatter: ({ cellValue }) => cellValue || '-',
    },
  ];
}
