import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { VipManageApi } from '#/api/manage/vip';

import { z } from '#/adapter/form';

export function getVipStatusOptions() {
  return [
    { color: 'default', label: '未使用', value: 0 },
    { color: 'green', label: '已使用', value: 1 },
    { color: 'orange', label: '已过期', value: 2 },
    { color: 'red', label: '已作废', value: 3 },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Select',
      componentProps: {
        placeholder: '请选择卡类型',
        style: { width: '100%' },
        options: [
          { label: '月卡 (30天)', value: 'month' },
          { label: '季卡 (90天)', value: 'quarter' },
          { label: '年卡 (365天)', value: 'year' },
        ],
      },
      fieldName: 'cardType',
      label: '卡类型',
      rules: z.string().min(1, '请选择卡类型'),
      defaultValue: 'month',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        max: 1000,
        placeholder: '输入生成数量',
        style: { width: '100%' },
      },
      fieldName: 'count',
      label: '生成数量',
      rules: z.number().min(1, '请输入生成数量').max(1000, '一次最多生成1000张'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        max: 3650,
        placeholder: '输入VIP天数',
        style: { width: '100%' },
      },
      fieldName: 'cardDays',
      label: 'VIP天数',
      rules: z.number().min(1, '请输入VIP天数').max(3650, '最多3650天'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 2,
        placeholder: '输入价格',
        style: { width: '100%' },
      },
      fieldName: 'cardPrice',
      label: '价格(元)',
      rules: z.number().min(0, '价格不能为负数'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 3650,
        placeholder: '不填则永久有效',
        style: { width: '100%' },
      },
      fieldName: 'expireDays',
      label: '卡密有效期(天)',
      help: '卡密本身的有效期,超过此期限卡密无法使用',
      rules: z.number().min(0).max(3650).optional(),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<VipManageApi.VipCardInfo>,
  canDelete?: boolean,
): VxeTableGridOptions<VipManageApi.VipCardInfo>['columns'] {
  return [
    { title: '序号', type: 'seq', width: 50 },
    {
      title: '卡号',
      field: 'cardCode',
      minWidth: 200,
    },
    {
      title: '卡类型',
      field: 'cardType',
      width: 100,
      formatter: ({ cellValue }) => {
        const typeMap: Record<string, string> = {
          month: '月卡',
          quarter: '季卡',
          year: '年卡',
        };
        return typeMap[cellValue] || cellValue;
      },
    },
    {
      title: 'VIP天数',
      field: 'cardDays',
      width: 100,
      formatter: ({ cellValue }) => `${cellValue}天`,
    },
    {
      title: '价格',
      field: 'cardPrice',
      width: 100,
      formatter: ({ cellValue }) => `¥${cellValue}`,
    },
    {
      title: '批次号',
      field: 'batchNo',
      width: 160,
      showOverflow: true,
    },
    {
      title: '使用状态',
      field: 'status',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: getVipStatusOptions(),
      },
    },
    {
      title: '使用用户ID',
      field: 'usedUserId',
      width: 120,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      title: '使用时间',
      field: 'usedTime',
      width: 180,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
    {
      title: '卡密有效期',
      field: 'expireAt',
      width: 180,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '永久';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
    {
      title: '创建时间',
      field: 'createdAt',
      width: 180,
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'cardCode',
          nameTitle: 'VIP卡',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: canDelete ? [
          {
            code: 'delete',
            disabled: (row: VipManageApi.VipCardInfo) => row.status !== 0,
          },
        ] : [],
      },
      field: 'operation',
      fixed: 'right',
      showOverflow: false,
      title: '操作',
      width: 100,
    },
  ];
}
