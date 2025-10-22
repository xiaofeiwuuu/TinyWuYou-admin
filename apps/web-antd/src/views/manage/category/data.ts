import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { CategoryManageApi } from '#/api/manage/category';

import { z } from '#/adapter/form';
import { uploadFile } from '#/api/core/upload';
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';

export function getContentTypeOptions() {
  return [
    { color: 'blue', label: '图片', value: 'image' },
    { color: 'default', label: '文案', value: 'text' },
  ];
}

export function getImageTypeOptions() {
  return IMAGE_TYPE_OPTIONS;
}

export function useSchema(): VbenFormSchema[] {
  return [
    // 1. 内容类型
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '图片', value: 'image' },
          { label: '文案', value: 'text' },
        ],
        optionType: 'button',
      },
      defaultValue: 'image',
      fieldName: 'contentType',
      label: '内容类型',
      rules: z.string().min(1, '请选择内容类型'),
    },
    // 2. 图片类型(仅图片时显示)
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: IMAGE_TYPE_OPTIONS.map((item) => ({
          label: item.label,
          value: item.value,
        })),
        optionType: 'button',
      },
      dependencies: {
        triggerFields: ['contentType'],
        if(values) {
          return values.contentType === 'image';
        },
      },
      defaultValue: 'avatar',
      fieldName: 'imageType',
      label: '图片类型',
      rules: z.string().optional(),
    },
    // 3. 分类名称
    {
      component: 'Input',
      fieldName: 'name',
      label: '分类名称',
      rules: z
        .string()
        .min(1, '请输入分类名称')
        .max(50, '分类名称不能超过50个字符'),
    },
    // 6. 排序
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
    // 4. 图标上传
    {
      component: 'Upload',
      componentProps: {
        accept: '.png,.jpg,.jpeg,.svg,.webp',
        customRequest: uploadFile,
        listType: 'picture-card',
        maxCount: 1,
        multiple: false,
        showUploadList: true,
      },
      fieldName: 'iconUrl',
      label: '分类图标',
      help: '支持 PNG、JPG、SVG 格式，建议尺寸 128x128',
      renderComponentContent: () => {
        return {
          default: () => '上传图标',
        };
      },
    },
    // 5. 状态
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
      fieldName: 'status',
      label: '状态',
      rules: z.number().min(0).max(1),
    },
    // 7. 描述(放最后)
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 200,
        rows: 3,
        showCount: true,
        class: 'w-full',
      },
      fieldName: 'description',
      label: '描述',
      rules: z.string().max(200, '描述不能超过200个字符').optional(),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<CategoryManageApi.CategoryInfo>,
  onStatusChange?: (
    newStatus: any,
    row: CategoryManageApi.CategoryInfo,
  ) => PromiseLike<boolean | undefined>,
  canEdit?: boolean,
  canDelete?: boolean,
): VxeTableGridOptions<CategoryManageApi.CategoryInfo>['columns'] {
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
      title: '图标',
      field: 'iconUrl',
      width: 80,
      cellRender: {
        name: 'CellImage',
      },
    },
    {
      title: '分类名称',
      field: 'name',
      minWidth: 150,
    },
    {
      title: '内容类型',
      field: 'contentType',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: getContentTypeOptions(),
      },
    },
    {
      title: '图片类型',
      field: 'imageType',
      width: 100,
      cellRender: {
        name: 'CellTag',
        options: getImageTypeOptions(),
      },
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
      sortable: true,
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
      width: 120,
    },
  ];
}
