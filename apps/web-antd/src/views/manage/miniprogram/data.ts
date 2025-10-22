import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { MiniProgramManageApi } from '#/api/manage/miniprogram';

import { z } from '#/adapter/form';
import { uploadFile } from '#/api/core/upload';

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'Input',
      fieldName: 'appId',
      label: 'AppID',
      rules: z.string().min(1, '请输入AppID').max(50, 'AppID不能超过50个字符'),
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '小程序名称',
      rules: z
        .string()
        .min(1, '请输入小程序名称')
        .max(100, '小程序名称不能超过100个字符'),
    },
    {
      component: 'Input',
      fieldName: 'path',
      label: '小程序路径',
      componentProps: {
        placeholder: '例如: pages/index/index',
      },
      rules: z.string().max(255, '路径不能超过255个字符').optional(),
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 9999,
        placeholder: '数字越大越靠前',
        class: 'w-full',
      },
      defaultValue: 0,
      fieldName: 'sortOrder',
      label: '排序',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: '.png,.jpg,.jpeg,.webp',
        customRequest: uploadFile,
        listType: 'picture-card',
        maxCount: 1,
        multiple: false,
        showUploadList: true,
      },
      fieldName: 'coverUrl',
      label: '封面图',
      help: '支持 PNG、JPG 格式，建议尺寸 750x400',
      renderComponentContent: () => {
        return {
          default: () => '上传封面',
        };
      },
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 255,
        rows: 3,
        showCount: true,
        class: 'w-full',
      },
      fieldName: 'description',
      label: '小程序描述',
      rules: z.string().max(255, '描述不能超过255个字符').optional(),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<MiniProgramManageApi.MiniProgramInfo>,
  onStatusChange?: (
    newStatus: any,
    row: MiniProgramManageApi.MiniProgramInfo,
  ) => PromiseLike<boolean | undefined>,
  canEdit?: boolean,
  canDelete?: boolean,
): VxeTableGridOptions<MiniProgramManageApi.MiniProgramInfo>['columns'] {
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
      title: '封面图',
      field: 'coverUrl',
      width: 100,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      title: 'AppID',
      field: 'appId',
      minWidth: 150,
    },
    {
      title: '小程序名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '小程序路径',
      field: 'path',
      minWidth: 150,
      showOverflow: true,
    },
    {
      title: '描述',
      field: 'description',
      minWidth: 200,
      showOverflow: true,
    },
    {
      title: '排序',
      field: 'sortOrder',
      width: 80,
    },
    {
      title: '状态',
      field: 'status',
      width: 100,
      cellRender: {
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
        attrs: { beforeChange: onStatusChange },
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
          nameField: 'name',
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
      width: 200,
    },
  ];
}
