import { requestClient } from '#/api/request';

export namespace MiniProgramManageApi {
  /** 小程序列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    status?: number;
  }

  /** 小程序信息 */
  export interface MiniProgramInfo {
    id: number;
    appId: string;
    name: string;
    description: string;
    path: string;
    coverUrl: string;
    sortOrder: number;
    status: number;
    createdAt: string;
    updatedAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: MiniProgramInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 创建/更新小程序 */
  export interface SaveParams {
    appId: string;
    name: string;
    description?: string;
    path?: string;
    coverUrl?: string;
    sortOrder?: number;
  }
}

/**
 * 获取小程序列表
 */
export async function getMiniProgramListApi(params: MiniProgramManageApi.ListParams) {
  return requestClient.get<MiniProgramManageApi.ListResult>('/admin/miniprograms', { params });
}

/**
 * 创建小程序
 */
export async function createMiniProgramApi(data: MiniProgramManageApi.SaveParams) {
  return requestClient.post('/admin/miniprograms', data);
}

/**
 * 更新小程序
 */
export async function updateMiniProgramApi(id: number, data: MiniProgramManageApi.SaveParams) {
  return requestClient.put(`/admin/miniprograms/${id}`, data);
}

/**
 * 删除小程序
 */
export async function deleteMiniProgramApi(id: number) {
  return requestClient.delete(`/admin/miniprograms/${id}`);
}

/**
 * 切换小程序状态
 */
export async function toggleMiniProgramStatusApi(id: number, status: number) {
  return requestClient.put(`/admin/miniprograms/${id}/status`, { status });
}
