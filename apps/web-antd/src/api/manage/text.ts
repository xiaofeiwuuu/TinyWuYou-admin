import { requestClient } from '#/api/request';

export namespace TextManageApi {
  /** 文案列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    keyword?: string;
    auditStatus?: number;
    status?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }

  /** 文案信息 */
  export interface TextInfo {
    id: number;
    categoryId: number;
    content: string;
    authorName: string;
    sourceName: string;
    copyCount: number;
    collectCount: number;
    hotScore: number;
    isVip: number;
    isRecommend: number;
    auditStatus: number;
    status: number;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: TextInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 创建/更新文案 */
  export interface SaveParams {
    categoryId: number;
    content: string;
    authorName?: string;
    sourceName?: string;
    tags?: string;
    isVip?: number;
    isRecommend?: number;
  }
}

/**
 * 获取文案列表
 */
export async function getTextListApi(params: TextManageApi.ListParams) {
  return requestClient.get<TextManageApi.ListResult>('/admin/texts', { params });
}

/**
 * 创建文案
 */
export async function createTextApi(data: TextManageApi.SaveParams) {
  return requestClient.post('/admin/texts', data);
}

/**
 * 更新文案
 */
export async function updateTextApi(id: number, data: TextManageApi.SaveParams) {
  return requestClient.put(`/admin/texts/${id}`, data);
}

/**
 * 删除文案
 */
export async function deleteTextApi(id: number) {
  return requestClient.delete(`/admin/texts/${id}`);
}

/**
 * 审核文案
 */
export async function auditTextApi(id: number, status: number) {
  return requestClient.put(`/admin/texts/${id}/audit`, { status });
}

/**
 * 批量导入文案
 */
export async function batchImportTextsApi(texts: TextManageApi.SaveParams[]) {
  return requestClient.post('/admin/texts/batch', { texts });
}
