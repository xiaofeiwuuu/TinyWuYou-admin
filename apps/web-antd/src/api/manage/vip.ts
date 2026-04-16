import { requestClient } from '#/api/request';

export namespace VipManageApi {
  /** VIP卡列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    cardCode?: string;
    cardType?: string;
    status?: number;
    batchNo?: string;
  }

  /** VIP卡信息 */
  export interface VipCardInfo {
    id: number;
    cardCode: string;
    cardType: string;
    cardDays: number;
    downloadCount: number;
    cardPrice: number;
    status: number; // 0未使用 1已使用 2已过期 3已作废
    usedUserId: number | null;
    usedTime: string | null;
    usedIp: string | null;
    batchNo: string | null;
    createdAt: string;
    expireAt: string | null;
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
    cardType?: string;
    count: number;
    cardDays: number;
    downloadCount?: number;
    cardPrice: number;
    expireDays?: number;
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
 * 作废VIP卡
 */
export async function voidVipCardApi(id: number) {
  return requestClient.put(`/admin/vip-cards/${id}/void`);
}
