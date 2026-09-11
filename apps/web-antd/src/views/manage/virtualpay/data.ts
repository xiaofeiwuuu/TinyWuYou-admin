import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { VirtualPayApi } from '#/api/manage/virtualpay';

import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';

export function getTypeOptions() {
  return [
    { color: 'blue', label: 'VIP会员', value: 'vip' },
    { color: 'purple', label: '下载次数', value: 'download' },
  ];
}

export function getStatusOptions() {
  return [
    { color: 'green', label: '启用', value: 1 },
    { color: 'red', label: '禁用', value: 0 },
  ];
}

/** 新增/编辑表单 schema */
export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: { placeholder: '需与公众平台虚拟商品 ID 一致（编辑时勿改）' },
      fieldName: 'productId',
      label: '商品ID',
      help: '必须与微信公众平台「虚拟支付」里的商品 ID 完全一致,否则用户无法下单',
      rules: z.string().min(1, '请输入商品ID'),
    },
    {
      component: 'Input',
      componentProps: { placeholder: '如 30天VIP会员' },
      fieldName: 'name',
      label: '商品名称',
      rules: z.string().min(1, '请输入商品名称'),
    },
    {
      component: 'Select',
      componentProps: {
        options: [
          { label: 'VIP会员', value: 'vip' },
          { label: '下载次数', value: 'download' },
        ],
        placeholder: '选择发货类型',
      },
      fieldName: 'type',
      label: '类型',
      defaultValue: 'vip',
      rules: z.string().min(1, '请选择类型'),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 1, max: 999999, precision: 0, style: { width: '100%' } },
      fieldName: 'amount',
      label: '数量',
      help: 'VIP=会员天数，下载=下载次数',
      rules: z.number().min(1, '数量至少为 1'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        precision: 0,
        style: { width: '100%' },
        placeholder: '单位：分（如 600 = ¥6.00）',
      },
      fieldName: 'price',
      label: '价格(分)',
      rules: z.number().min(0, '价格不能为负'),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, max: 9999, precision: 0, style: { width: '100%' } },
      fieldName: 'sortOrder',
      label: '排序',
      help: '数值越大越靠前',
      defaultValue: 0,
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
        optionType: 'button',
      },
      fieldName: 'isEnabled',
      label: '状态',
      defaultValue: 1,
    },
  ];
}

/** 表格列 */
export function useColumns(
  onActionClick?: OnActionClickFn<VirtualPayApi.ProductInfo>,
  onStatusChange?: (
    newStatus: number,
    row: VirtualPayApi.ProductInfo,
  ) => Promise<boolean> | boolean,
): VxeTableGridOptions<VirtualPayApi.ProductInfo>['columns'] {
  return [
    { title: '商品ID', field: 'productId', minWidth: 140 },
    { title: '名称', field: 'name', minWidth: 160 },
    {
      title: '类型',
      field: 'type',
      width: 120,
      cellRender: { name: 'CellTag', options: getTypeOptions() },
    },
    { title: '数量', field: 'amount', width: 100 },
    {
      title: '价格(元)',
      field: 'price',
      width: 110,
      formatter: ({ cellValue }) => `¥${(Number(cellValue) / 100).toFixed(2)}`,
    },
    { title: '排序', field: 'sortOrder', width: 90 },
    {
      title: '状态',
      field: 'isEnabled',
      width: 100,
      // 有改状态回调时用开关，否则退回只读标签
      cellRender: onStatusChange
        ? { name: 'CellSwitch', attrs: { beforeChange: onStatusChange } }
        : { name: 'CellTag', options: getStatusOptions() },
    },
    {
      title: '创建时间',
      field: 'createdAt',
      width: 170,
      formatter: ({ cellValue }) => (cellValue ? formatDateTime(cellValue) : ''),
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '商品',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: ['edit', 'delete'],
      },
      field: 'operation',
      fixed: 'right',
      showOverflow: false,
      title: '操作',
      width: 140,
    },
  ];
}
