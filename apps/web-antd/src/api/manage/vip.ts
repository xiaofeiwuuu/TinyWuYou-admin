import { requestClient } from '#/api/request';

export namespace VipManageApi {
  /** VIP卡列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
    isUsed?: number;
  }

  /** VIP卡信息 */
  export interface VipCardInfo {
    id: number;
    cardCode: string;
    days: number;
    price: number;
    description: string;
    isUsed: number;
    usedByUserId: number | null;
    usedAt: string | null;
    status: number;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: VipCardInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 生成VIP卡参数 */
  export interface GenerateParams {
    count: number;
    days: number;
    price: number;
    description?: string;
  }

  /** 批量生成结果 */
  export interface GenerateResult {
    count: number;
    cards: string[];
  }
}

/**
 * 获取VIP卡列表
 */
export async function getVipCardListApi(params: VipManageApi.ListParams) {
  return requestClient.get<VipManageApi.ListResult>('/admin/vip-cards', {
    params,
  });
}

/**
 * 批量生成VIP卡
 */
export async function generateVipCardsApi(data: VipManageApi.GenerateParams) {
  return requestClient.post<VipManageApi.GenerateResult>(
    '/admin/vip-cards/generate',
    data,
  );
}

/**
 * 删除VIP卡
 */
export async function deleteVipCardApi(id: number) {
  return requestClient.delete(`/admin/vip-cards/${id}`);
}

/**
 * 切换VIP卡状态
 */
export async function toggleVipCardStatusApi(id: number, status: number) {
  return requestClient.put(`/admin/vip-cards/${id}/status`, { status });
}

/**
 * 导出VIP卡
 */
export async function exportVipCardsApi(params: { isUsed?: number }) {
  return requestClient.get<VipManageApi.VipCardInfo[]>(
    '/admin/vip-cards/export',
    {
      params,
    },
  );
}
