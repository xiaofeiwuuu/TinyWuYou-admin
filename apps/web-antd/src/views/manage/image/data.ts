import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { ImageManageApi } from '#/api/manage/image';

import { z } from '#/adapter/form';
import { getCategoryListApi } from '#/api/manage/category';
import { uploadFile } from '#/api/core/upload';
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';

export function getImageTypeOptions() {
  return IMAGE_TYPE_OPTIONS;
}

export function useSchema(): VbenFormSchema[] {
  return [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: IMAGE_TYPE_OPTIONS.map(item => ({ label: item.label, value: item.value })),
        optionType: 'button',
      },
      defaultValue: 'avatar',
      fieldName: 'imageType',
      label: '图片类型',
      rules: z.string().min(1, '请选择图片类型'),
      formItemClass: 'col-span-2',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        placeholder: '请选择分类',
        options: [],
      },
      dependencies: {
        async componentProps(values) {
          if (values.imageType) {
            const res = await getCategoryListApi({
              contentType: 'image',
              imageType: values.imageType,
              page: 1,
              pageSize: 100
            });
            return {
              options: res.list.map((item) => ({ label: item.name, value: item.id })),
            };
          }
          return { options: [] };
        },
        triggerFields: ['imageType'],
      },
      fieldName: 'categoryId',
      label: '分类',
      rules: z.string().min(1, '请选择分类'),
      formItemClass: 'col-span-2',
    },
    {
      component: 'Input',
      fieldName: 'title',
      label: '标题',
      rules: z.string().min(1, '请输入标题').max(100, '标题不能超过100个字符'),
      formItemClass: 'col-span-2',
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
      formItemClass: 'col-span-2',
    },
    {
      component: 'Upload',
      componentProps: {
        accept: '.png,.jpg,.jpeg,.webp,.gif',
        customRequest: uploadFile,
        listType: 'picture-card',
        maxCount: 1,
        multiple: false,
        showUploadList: true,
      },
      fieldName: 'imageUrl',
      label: '图片',
      help: '支持 PNG、JPG、WEBP、GIF 格式',
      rules: z.any().refine((val) => val && val.length > 0, '请上传图片'),
      formItemClass: 'col-span-2',
      renderComponentContent: () => {
        return {
          default: () => '上传图片',
        };
      },
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'isVip',
      label: 'VIP专属',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'isRecommend',
      label: '推荐',
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
      label: '描述',
      rules: z.string().max(255, '描述不能超过255个字符').optional(),
      formItemClass: 'col-span-2',
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<ImageManageApi.ImageInfo>,
  onStatusChange?: (
    newStatus: any,
    row: ImageManageApi.ImageInfo,
  ) => PromiseLike<boolean | undefined>,
  canEdit?: boolean,
  canDelete?: boolean,
): VxeTableGridOptions<ImageManageApi.ImageInfo>['columns'] {
  // 根据权限生成操作按钮列表
  const operations = [];
  if (canEdit) {
    operations.push('edit');
  }
  if (canDelete) {
    operations.push('delete');
  }

  return [
    {
      title: 'ID',
      field: 'id',
      width: 80,
      sortable: true,
    },
    {
      title: '缩略图',
      field: 'imageUrl',
      width: 120,
      cellRender: {
        name: 'CellImage',
      },
      formatter: ({ row }) => {
        return row.thumbnailUrl || row.imageUrl;
      },
    },
    {
      title: '标题',
      field: 'title',
      minWidth: 150,
    },
    {
      title: '分类',
      field: 'categoryName',
      width: 120,
    },
    {
      title: '类型',
      field: 'imageType',
      width: 120,
      cellRender: {
        name: 'CellTag',
        options: getImageTypeOptions(),
      },
    },
    {
      title: '下载量',
      field: 'downloadCount',
      width: 100,
      sortable: true,
    },
    {
      title: '收藏量',
      field: 'collectCount',
      width: 100,
      sortable: true,
    },
    {
      title: '热度',
      field: 'hotScore',
      width: 100,
      sortable: true,
    },
    {
      title: 'VIP',
      field: 'isVip',
      width: 80,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '普通', value: 0 },
          { color: 'gold', label: 'VIP', value: 1 },
        ],
      },
    },
    {
      title: '推荐',
      field: 'isRecommend',
      width: 80,
      cellRender: {
        name: 'CellTag',
        options: [
          { color: 'default', label: '否', value: 0 },
          { color: 'red', label: '是', value: 1 },
        ],
      },
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
          nameField: 'title',
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
