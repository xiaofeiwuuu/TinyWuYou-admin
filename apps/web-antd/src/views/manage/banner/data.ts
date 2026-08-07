import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { VbenFormSchema } from '#/adapter/form';
import type { OnActionClickFn } from '#/adapter/vxe-table';
import type { BannerApi } from '#/api/manage/banner';

import { formatDateTime } from '@vben/utils';

import { z } from '#/adapter/form';
import { deleteUploadedFile, uploadFile } from '#/api/core/upload';
import { getCategoryListApi } from '#/api/manage/category';

/** 图片分类下拉选项：轮播只能跳图片分类，所以按 contentType=image 过滤 */
async function fetchImageCategoryOptions() {
  const res = await getCategoryListApi({
    contentType: 'image',
    page: 1,
    pageSize: 200,
  });
  return (res?.list ?? []).map((c) => ({ label: c.name, value: c.id }));
}

export function getStatusOptions() {
  return [
    { color: 'green', label: '启用', value: 1 },
    { color: 'red', label: '禁用', value: 0 },
  ];
}

export function useSchema(
  onPreview?: (file: any) => void,
): VbenFormSchema[] {
  return [
    {
      component: 'Upload',
      componentProps: {
        accept: '.png,.jpg,.jpeg,.webp,.gif',
        customRequest: uploadFile,
        listType: 'picture-card',
        maxCount: 1,
        multiple: false,
        showUploadList: true,
        // 点已上传的图 → 弹层放大预览。不配的话 antd 默认 window.open(file.url) 打开新页面
        onPreview,
        onRemove: async (file: any) => {
          let url = file.response?.url || file.url;
          if (url) {
            if (url.includes('://')) {
              try {
                url = new URL(url).pathname;
              } catch {
                // 保持原值
              }
            }
            try {
              await deleteUploadedFile(url);
            } catch (error) {
              console.error('删除文件失败:', error);
            }
          }
          return true;
        },
      },
      fieldName: 'imageUrl',
      label: '轮播图',
      help: '建议横幅比例（如 16:9），支持 PNG/JPG/WEBP/GIF',
      // Upload 的 fileList 只接受数组，空字符串会抛 .map is not a function
      defaultValue: [],
      rules: z.any().refine((val) => val && val.length > 0, '请上传轮播图'),
      renderComponentContent: () => ({ default: () => '上传轮播图' }),
    },
    {
      component: 'ApiSelect',
      componentProps: {
        api: fetchImageCategoryOptions,
        placeholder: '选择点击后要跳转到的图片分类（不选=只展示不跳）',
        allowClear: true,
        showSearch: true,
        // 选项的 label 字段用于搜索过滤
        optionFilterProp: 'label',
      },
      fieldName: 'categoryId',
      label: '跳转分类',
      help: '点击这张轮播图，会进入所选分类的图片列表',
    },
    {
      component: 'InputNumber',
      componentProps: { min: 0, max: 9999, style: { width: '100%' } },
      fieldName: 'sortOrder',
      label: '排序',
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
      help: '禁用后小程序首页不再展示这张轮播',
      defaultValue: 1,
    },
  ];
}

export function useColumns(
  onActionClick?: OnActionClickFn<BannerApi.BannerInfo>,
  canEdit?: boolean,
  canDelete?: boolean,
  onStatusChange?: (
    newStatus: number,
    row: BannerApi.BannerInfo,
  ) => Promise<boolean>,
): VxeTableGridOptions<BannerApi.BannerInfo>['columns'] {
  const operations: string[] = [];
  if (canEdit) operations.push('edit');
  if (canDelete) operations.push('delete');

  return [
    {
      title: '轮播图',
      field: 'imageUrl',
      width: 160,
      cellRender: { name: 'CellImage' },
      formatter: ({ row }) => row.imageUrl,
    },
    {
      title: '跳转分类',
      field: 'categoryName',
      minWidth: 140,
      formatter: ({ cellValue }) => cellValue || '（不跳转）',
    },
    { title: '排序', field: 'sortOrder', width: 90 },
    {
      title: '状态',
      field: 'isEnabled',
      width: 100,
      cellRender: {
        name: onStatusChange ? 'CellSwitch' : 'CellTag',
        options: getStatusOptions(),
        attrs: { beforeChange: onStatusChange },
      },
    },
    {
      title: '创建时间',
      field: 'createdAt',
      width: 170,
      // 后端返回的是 UTC ISO（...Z），formatDateTime 用 dayjs 按本地时区
      // 格式化成 YYYY-MM-DD HH:mm:ss，一并解决"原始格式"和"差 8 小时"两个问题
      formatter: ({ cellValue }) => (cellValue ? formatDateTime(cellValue) : ''),
    },
    {
      align: 'center',
      cellRender: {
        attrs: {
          nameField: 'categoryName',
          nameTitle: '轮播图',
          onClick: onActionClick,
        },
        name: 'CellOperation',
        options: operations,
      },
      field: 'operation',
      fixed: 'right',
      showOverflow: false,
      title: '操作',
      width: 140,
    },
  ];
}
