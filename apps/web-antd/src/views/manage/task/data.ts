import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { TaskManageApi } from '#/api/manage/task';

import { z } from '#/adapter/form';

export function getTaskTypeOptions() {
  return [
    { color: 'blue', label: '新手任务', value: 'newbie' },
    { color: 'green', label: '签到任务', value: 'signin' },
    { color: 'orange', label: '邀请任务', value: 'invite' },
    { color: 'purple', label: '广告任务', value: 'ad' },
  ];
}

export function getRefreshTypeOptions() {
  return [
    { color: 'default', label: '一次性', value: 'once' },
    { color: 'blue', label: '每日刷新', value: 'daily' },
    { color: 'green', label: '无限次', value: 'unlimited' },
  ];
}

export function getTaskStatusOptions() {
  return [
    { color: 'green', label: '启用', value: 1 },
    { color: 'red', label: '禁用', value: 0 },
  ];
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      componentProps: {
        maxLength: 20,
        placeholder: '请输入任务类型',
      },
      fieldName: 'taskType',
      label: '任务类型',
      rules: z.string().min(1, '请输入任务类型').max(20, '任务类型不能超过20个字符'),
    },
    {
      component: 'Input',
      componentProps: {
        maxLength: 50,
        placeholder: '请输入任务名称',
      },
      fieldName: 'taskName',
      label: '任务名称',
      rules: z.string().min(1, '请输入任务名称').max(50, '任务名称不能超过50个字符'),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 255,
        placeholder: '请输入任务描述',
        rows: 3,
        showCount: true,
        class: 'w-full'
      },
      fieldName: 'taskDesc',
      label: '任务描述',
      rules: z.string().max(255, '任务描述不能超过255个字符').optional(),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 1,
        placeholder: '请输入奖励次数',
        style: { width: '100%' },
      },
      defaultValue: 1,
      fieldName: 'rewardCount',
      label: '奖励次数',
      rules: z.number().min(1, '奖励次数至少为1'),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        placeholder: '请输入每日上限(0为不限)',
        style: { width: '100%' },
      },
      defaultValue: 0,
      fieldName: 'dailyLimit',
      label: '每日上限',
      help: '0表示不限次数',
      rules: z.number().min(0),
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '一次性', value: 'once' },
          { label: '每日刷新', value: 'daily' },
          { label: '无限次', value: 'unlimited' },
        ],
        optionType: 'button',
      },
      defaultValue: 'once',
      fieldName: 'refreshType',
      label: '刷新类型',
      rules: z.enum(['once', 'daily', 'unlimited']),
    },
    {
      component: 'InputNumber',
      componentProps: {
        max: 9999,
        min: 0,
        placeholder: '数字越大越靠前',
        style: { width: '100%' },
      },
      defaultValue: 0,
      fieldName: 'sortOrder',
      label: '排序',
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
      defaultValue: 1,
      fieldName: 'isEnabled',
      label: '状态',
      rules: z.number().min(0).max(1),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<TaskManageApi.TaskInfo>,
  onStatusChange?: (newStatus: any, row: TaskManageApi.TaskInfo) => PromiseLike<boolean | undefined>,
  canEdit?: boolean,
  canDelete?: boolean,
): VxeTableGridOptions<TaskManageApi.TaskInfo>['columns'] {
  // 根据权限生成操作按钮列表
  const operations = [];
  if (canEdit) {
    operations.push('edit');
  }
  if (canDelete) {
    operations.push('delete');
  }

  return [
    { title: '序号', type: 'seq', width: 50 },
    {
      title: '任务类型',
      field: 'taskType',
      minWidth: 120,
    },
    {
      title: '任务名称',
      field: 'taskName',
      minWidth: 150,
    },
    {
      title: '任务描述',
      field: 'taskDesc',
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: '奖励次数',
      field: 'rewardCount',
      width: 100,
      formatter: ({ cellValue }) => `${cellValue}次`,
    },
    {
      title: '每日上限',
      field: 'dailyLimit',
      width: 100,
      formatter: ({ cellValue }) => cellValue === 0 ? '不限' : `${cellValue}次`,
    },
    {
      title: '刷新类型',
      field: 'refreshType',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: getRefreshTypeOptions(),
      },
    },
    {
      title: '排序',
      field: 'sortOrder',
      width: 80,
    },
    {
      title: '状态',
      field: 'isEnabled',
      width: 100,
      cellRender: {
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
        attrs: { beforeChange: onStatusChange },
        options: getTaskStatusOptions(),
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
      align: 'right',
      cellRender: {
        attrs: {
          nameField: 'taskName',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: operations,
      },
      field: 'operation',
      fixed: 'right',
      headerAlign: 'center',
      showOverflow: false,
      title: '操作',
      width: 120,
    },
  ];
}
