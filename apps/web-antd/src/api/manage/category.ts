import { requestClient } from '#/api/request';
import type { ImageType } from '#/constants/image-type';

export namespace CategoryManageApi {
  /** 分类列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    contentType?: 'image' | 'text';
    imageType?: ImageType;
    keyword?: string;
    status?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }

  /** 分类信息 */
  export interface CategoryInfo {
    id: number;
    name: string;
    description: string;
    iconUrl: string;
    contentType: 'image' | 'text';
    imageType?: ImageType;
    sortOrder: number;
    status: number;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: CategoryInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 创建/更新分类 */
  export interface SaveParams {
    name?: string;
    description?: string;
    iconUrl?: string;
    contentType?: 'image' | 'text';
    imageType?: ImageType;
    sortOrder?: number;
    status?: number;
  }
}

/**
 * 获取分类列表
 */
export async function getCategoryListApi(params: CategoryManageApi.ListParams) {
  return requestClient.get<CategoryManageApi.ListResult>('/admin/categories', {
    params,
  });
}

/**
 * 创建分类
 */
export async function createCategoryApi(data: CategoryManageApi.SaveParams) {
  return requestClient.post('/admin/categories', data);
}

/**
 * 更新分类
 */
export async function updateCategoryApi(
  id: number,
  data: CategoryManageApi.SaveParams,
) {
  return requestClient.put(`/admin/categories/${id}`, data);
}

/**
 * 删除分类
 */
export async function deleteCategoryApi(id: number) {
  return requestClient.delete(`/admin/categories/${id}`);
}

/**
 * 切换分类状态
 */
export async function toggleCategoryStatusApi(id: number, status: number) {
  return requestClient.put(`/admin/categories/${id}/status`, { status });
}
