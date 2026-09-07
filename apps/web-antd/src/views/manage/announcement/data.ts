import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { AnnouncementApi } from '#/api/manage/announcement';

import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';

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
      componentProps: { placeholder: '公告标题（≤50字建议）' },
      fieldName: 'title',
      label: '标题',
      rules: z.string().min(1, '请输入标题'),
    },
    {
      component: 'Textarea',
      componentProps: {
        placeholder: '公告内容',
        rows: 6,
        maxlength: 2000,
        showCount: true,
      },
      fieldName: 'content',
      label: '内容',
      rules: z.string().min(1, '请输入内容'),
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
      help: '小程序弹「最新启用」的一条；停用后不再下发',
      defaultValue: 1,
    },
  ];
}

/** 表格列 */
export function useColumns(
  onActionClick?: OnActionClickFn<AnnouncementApi.Info>,
): VxeTableGridOptions<AnnouncementApi.Info>['columns'] {
  return [
    { title: 'ID', field: 'id', width: 80 },
    { title: '标题', field: 'title', minWidth: 160 },
    { title: '内容', field: 'content', minWidth: 240, showOverflow: 'tooltip' },
    {
      title: '状态',
      field: 'isEnabled',
      width: 100,
      cellRender: { name: 'CellTag', options: getStatusOptions() },
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
          nameField: 'title',
          nameTitle: '公告',
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
