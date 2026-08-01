import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { ImageTypeApi } from '#/api/manage/image-type';

import { z } from '#/adapter/form';

/** 朝向选项。客户端按它决定列表布局 */
export function getOrientationOptions() {
  return [
    { color: 'green', label: '竖图', value: 'portrait' },
    { color: 'blue', label: '横图', value: 'landscape' },
    { color: 'orange', label: '方图', value: 'square' },
  ];
}

/** 后台标签可选色，与后端 DTO 里的白名单保持一致 */
export function getColorOptions() {
  return [
    { label: '蓝色', value: 'blue' },
    { label: '绿色', value: 'green' },
    { label: '青色', value: 'cyan' },
    { label: '橙色', value: 'orange' },
    { label: '紫色', value: 'purple' },
    { label: '红色', value: 'red' },
    { label: '洋红', value: 'magenta' },
    { label: '金色', value: 'gold' },
    { label: '青柠', value: 'lime' },
    { label: '灰色', value: 'default' },
  ];
}

export function getStatusOptions() {
  return [
    { color: 'green', label: '启用', value: 1 },
    { color: 'red', label: '禁用', value: 0 },
  ];
}

/**
 * @param isEdit 编辑时 code 只读——它是 images / categories 里实际存储的值，
 *               改掉会让所有存量数据的类型变成悬空值
 */
export function useSchema(isEdit = false): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        disabled: isEdit,
        placeholder: '如 pendant，小写字母开头',
      },
      fieldName: 'code',
      label: '类型标识',
      help: isEdit
        ? '类型标识是图片和分类里实际存储的值，创建后不可修改'
        : '小写字母开头，由小写字母、数字、下划线组成，2-20 位',
      rules: isEdit
        ? 'required'
        : z
            .string()
            .regex(
              /^[a-z][a-z0-9_]{1,19}$/,
              '小写字母开头，仅含小写字母数字下划线，2-20位',
            ),
    },
    {
      component: 'Input',
      componentProps: { maxLength: 20, placeholder: '如 头像挂件' },
      fieldName: 'name',
      label: '类型名称',
      rules: z.string().min(1, '请输入类型名称').max(20, '不超过20个字符'),
    },
    {
      component: 'Select',
      componentProps: {
        options: getOrientationOptions().map(({ label, value }) => ({
          label,
          value,
        })),
        placeholder: '请选择图片朝向',
      },
      fieldName: 'orientation',
      label: '图片朝向',
      help: '决定小程序列表的布局：竖图瀑布流、方图九宫格、横图宽卡片',
      defaultValue: 'portrait',
      rules: 'required',
    },
    {
      component: 'Select',
      componentProps: { options: getColorOptions() },
      fieldName: 'color',
      label: '标签颜色',
      help: '仅影响后台列表里的标签配色',
      defaultValue: 'blue',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 9.99,
        step: 0.05,
        precision: 2,
        style: { width: '100%' },
      },
      fieldName: 'downloadWeight',
      label: '下载权重',
      help: '热度分 = 下载数 × 下载权重 + 收藏数 × 收藏权重',
      defaultValue: 0.6,
      rules: z.number().min(0).max(9.99),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 9.99,
        step: 0.05,
        precision: 2,
        style: { width: '100%' },
      },
      fieldName: 'collectWeight',
      label: '收藏权重',
      defaultValue: 0.4,
      rules: z.number().min(0).max(9.99),
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, max: 9999, style: { width: '100%' } },
      fieldName: 'sortOrder',
      label: '排序权重',
      help: '数值越大越靠前',
      defaultValue: 0,
    },
    {
      component: 'RadioGroup',
      componentProps: {
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
        optionType: 'button',
      },
      fieldName: 'isEnabled',
      label: '状态',
      help: '禁用后新建图片和分类不能再选这个类型，已有数据不受影响',
      defaultValue: 1,
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<ImageTypeApi.ImageTypeInfo>,
  canEdit?: boolean,
  canDelete?: boolean,
): VxeTableGridOptions<ImageTypeApi.ImageTypeInfo>['columns'] {
  const operations: string[] = [];
  if (canEdit) operations.push('edit');
  if (canDelete) operations.push('delete');

  return [
    { title: '类型标识', field: 'code', width: 140 },
    { title: '类型名称', field: 'name', minWidth: 130 },
    {
      title: '图片朝向',
      field: 'orientation',
      width: 100,
      cellRender: { name: 'CellTag', options: getOrientationOptions() },
    },
    {
      title: '热度权重',
      field: 'downloadWeight',
      width: 130,
      formatter: ({ row }) =>
        `下载 ${row.downloadWeight} / 收藏 ${row.collectWeight}`,
    },
    {
      title: '图片数',
      field: 'imageCount',
      width: 90,
      formatter: ({ cellValue }) => cellValue ?? 0,
    },
    {
      title: '分类数',
      field: 'categoryCount',
      width: 90,
      formatter: ({ cellValue }) => cellValue ?? 0,
    },
    { title: '排序', field: 'sortOrder', width: 80 },
    {
      title: '状态',
      field: 'isEnabled',
      width: 90,
      cellRender: { name: 'CellTag', options: getStatusOptions() },
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'name',
          nameTitle: '图片类型',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: operations.map((code) =>
          code === 'delete'
            ? {
                code: 'delete',
                // 有图片或分类在用就不给删，只能先禁用
                disabled: (row: ImageTypeApi.ImageTypeInfo) =>
                  row.imageCount > 0 || row.categoryCount > 0,
              }
            : code,
        ),
      },
      field: 'operation',
      fixed: 'right',
      showOverflow: false,
      title: '操作',
      width: 140,
    },
  ];
}
