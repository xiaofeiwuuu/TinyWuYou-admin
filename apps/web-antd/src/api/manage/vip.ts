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
 * 作废VIP卡
 */
export async function voidVipCardApi(id: number) {
  return requestClient.put(`/admin/vip-cards/${id}/void`);
}

/**
 * 批量作废（按勾选的 ID）
 *
 * 作废是软删除：status 置为 3，记录仍在列表里可见，可追溯。
 * 已使用的卡不会被改动。
 */
export async function batchVoidVipCardsApi(ids: number[]) {
  return requestClient.post<{ skippedCount: number; voidedCount: number }>(
    '/admin/vip-cards/batch/void',
    { ids },
  );
}

/**
 * 统计还剩多少张未使用的卡密（用于"全部作废"前的二次确认）
 */
export async function countVoidableVipCardsApi() {
  return requestClient.get<{ count: number }>(
    '/admin/vip-cards/voidable-count',
  );
}

/**
 * 全部作废：把所有未使用的卡密一次性作废
 */
export async function voidAllVipCardsApi() {
  return requestClient.post<{ voidedCount: number }>(
    '/admin/vip-cards/batch/void-all',
    { confirm: true },
  );
}
