import { requestClient } from '#/api/request';

export namespace BannedIpApi {
  export interface Item {
    id: number;
    ip: string;
    type: 'auto' | 'manual';
    reason: string | null;
    expiresAt: string | null;
    operator: string | null;
    createdAt: string;
    active: boolean;
  }
  export interface ListResult {
    list: Item[];
    total: number;
    page: number;
    pageSize: number;
  }
}

/** 封禁列表 */
export async function getBannedIpListApi(params: { page: number; pageSize: number }) {
  return requestClient.get<BannedIpApi.ListResult>('/admin/banned-ips', { params });
}

/** 手动封禁(ttlHours 不填或 0 = 永久) */
export async function banIpApi(data: { ip: string; reason?: string; ttlHours?: number }) {
  return requestClient.post('/admin/banned-ips', data);
}

/** 解封 */
export async function unbanIpApi(id: number) {
  return requestClient.delete(`/admin/banned-ips/${id}`);
}
