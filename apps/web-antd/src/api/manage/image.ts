import { requestClient } from '#/api/request';
import type { ImageType } from '#/constants/image-type';

export namespace ImageManageApi {
  /** 图片列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    id?: number;
    categoryId?: number;
    imageType?: ImageType;
    keyword?: string;
    auditStatus?: number;
    status?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }

  /** 图片信息 */
  export interface ImageInfo {
    id: number;
    categoryId: number;
    categoryName?: string;  // 分类名称（关联查询获取）
    imageType: ImageType;
    title: string;
    description: string;
    imageUrl: string;
    thumbnailUrl: string;
    downloadCount: number;
    collectCount: number;
    hotScore: number;
    isVip: number;
    isRecommend: number;
    sortOrder: number;
    status: number;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: ImageInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 创建/更新图片 */
  export interface SaveParams {
    categoryId: number;
    imageType: ImageType;
    title: string;
    description?: string;
    imageUrl: string;
    thumbnailUrl?: string;
    tags?: string;
    isVip?: number;
    isRecommend?: number;
  }
}

/**
 * 获取图片列表
 */
export async function getImageListApi(params: ImageManageApi.ListParams) {
  return requestClient.get<ImageManageApi.ListResult>('/admin/images', { params });
}

/**
 * 创建图片
 */
export async function createImageApi(data: ImageManageApi.SaveParams) {
  return requestClient.post('/admin/images', data);
}

/**
 * 更新图片
 */
export async function updateImageApi(id: number, data: ImageManageApi.SaveParams) {
  return requestClient.put(`/admin/images/${id}`, data);
}

/**
 * 删除图片
 */
export async function deleteImageApi(id: number) {
  return requestClient.delete(`/admin/images/${id}`);
}

/**
 * 审核图片
 */
export async function auditImageApi(id: number, status: number) {
  return requestClient.put(`/admin/images/${id}/audit`, { status });
}

/**
 * 批量导入图片
 */
export async function batchImportImagesApi(data: {
  categoryId: number;
  imageType: ImageType;
  isVip?: number;
  isRecommend?: number;
  sortOrder?: number;
  images: Array<{
    url: string;
    width?: number;
    height?: number;
    aspectRatio?: string;
    size?: number;
    originalName?: string;
    thumbnailUrl?: string;
  }>;
}) {
  return requestClient.post('/admin/images/batch', data);
}

/**
 * 批量更新图片
 */
export async function batchUpdateImagesApi(data: {
  ids: number[];
  updateData: {
    categoryId?: number;
    imageType?: ImageType;
    isVip?: number;
    isRecommend?: number;
    sortOrder?: number;
    description?: string;
    status?: number;
  };
}) {
  return requestClient.post('/admin/images/batch/update', data);
}

/**
 * 批量删除图片
 */
export async function batchDeleteImagesApi(ids: number[]) {
  return requestClient.post('/admin/images/batch/delete', { ids });
}
