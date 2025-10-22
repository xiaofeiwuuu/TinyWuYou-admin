import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { TextManageApi } from '#/api/manage/text';

import { z } from '#/adapter/form';
import { getCategoryListApi } from '#/api/manage/category';

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const res = await getCategoryListApi({
            contentType: 'text',
            page: 1,
            pageSize: 100,
          });
          return res.list.map((item) => ({ label: item.name, value: item.id }));
        },
        placeholder: '请选择分类',
        class: 'w-full',
        style: { width: '100%' },
      },
      fieldName: 'categoryId',
      label: '分类',
      rules: z.string().min(1, '请选择分类'),
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
      component: 'Input',
      componentProps: {
        maxLength: 100,
        placeholder: '请输入标题(可选)',
      },
      fieldName: 'title',
      label: '标题',
      rules: z.string().max(100, '标题不能超过100个字符').optional(),
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 5000,
        placeholder: '请输入文案内容',
        rows: 6,
        showCount: true,
        class: 'w-full',
      },
      fieldName: 'content',
      label: '文案内容',
      rules: z.string().min(1, '请输入文案内容'),
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<TextManageApi.TextInfo>,
  canEdit?: boolean,
  canDelete?: boolean,
): VxeTableGridOptions<TextManageApi.TextInfo>['columns'] {
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
      title: '标题',
      field: 'title',
      width: 150,
      showOverflow: true,
    },
    {
      title: '文案内容',
      field: 'content',
      minWidth: 250,
      showOverflow: true,
    },
    {
      title: '排序',
      field: 'sortOrder',
      width: 80,
      sortable: true,
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
          nameField: 'content',
          nameTitle: '文案',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: operations,
      },
      field: 'operation',
      fixed: 'right',
      showOverflow: false,
      title: '操作',
      width: 150,
    },
  ];
}
