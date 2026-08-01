import { requestClient } from '#/api/request';

export namespace UserVipApi {
  /** 开通方式 */
  export type SourceType = 'admin' | 'card' | 'purchase';

  export interface ListParams {
    page?: number;
    pageSize?: number;
    /** 用户昵称、UID 或 openid */
    userKeyword?: string;
    /** 卡号 */
    cardCode?: string;
    sourceType?: SourceType;
    /** 开通时间起止 YYYY-MM-DD */
    startDate?: string;
    endDate?: string;
  }

  /** 一条 VIP 开通记录 */
  export interface UserVipRecord {
    id: number;
    userId: number;
    /** 对外用户标识 */
    uid: null | string;
    nickname: null | string;
    avatarUrl: null | string;
    openid: null | string;
    /** VIP 生效时间 */
    startTime: string;
    /** VIP 到期时间 */
    expireTime: string;
    sourceType: SourceType;
    /** 开通（兑换）时间 */
    activatedAt: string;
    /** 以下字段只有 sourceType 为 card 时才有 */
    cardCode: null | string;
    cardDays: null | number;
    cardDownloadCount: null | number;
    cardPrice: null | number;
    batchNo: null | string;
  }

  export interface ListResult {
    list: UserVipRecord[];
    total: number;
    page: number;
    pageSize: number;
  }
}

/**
 * 获取 VIP 开通记录列表
 */
export async function getUserVipListApi(params: UserVipApi.ListParams) {
  return requestClient.get<UserVipApi.ListResult>('/admin/user-vips', {
    params,
  });
}
