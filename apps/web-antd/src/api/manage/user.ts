import { requestClient } from '#/api/request';

export namespace UserManageApi {
  /** 用户列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    id?: number;
    keyword?: string;
    userLevel?: number;
    isVip?: number;
  }

  /** 用户信息 */
  export interface UserInfo {
    id: number;
    openid: string;
    nickname: string;
    avatarUrl: string;
    downloadCount: number;
    userLevel: number;
    isVip: number;
    vipExpireTime: string | null;
    totalDownloads: number;
    totalCollections: number;
    status: number;
    remark: string;
    platform: string;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: UserInfo[];
    total: number;
    page: number;
    pageSize: number;
  }
}

/**
 * 获取用户列表
 */
export async function getUserListApi(params: UserManageApi.ListParams) {
  return requestClient.get<UserManageApi.ListResult>('/admin/users', { params });
}

/**
 * 获取用户详情
 */
export async function getUserDetailApi(id: number) {
  return requestClient.get<UserManageApi.UserInfo>(`/admin/users/${id}`);
}

/**
 * 更新用户下载次数
 */
export async function updateUserDownloadCountApi(id: number, count: number) {
  return requestClient.put(`/admin/users/${id}/download-count`, { count });
}

/**
 * 禁用/启用用户
 */
export async function toggleUserStatusApi(id: number, status: number) {
  return requestClient.put(`/admin/users/${id}/status`, { status });
}

/**
 * 更新用户备注
 */
export async function updateUserRemarkApi(id: number, remark: string) {
  return requestClient.put(`/admin/users/${id}/remark`, { remark });
}

/**
 * 开通/续期VIP
 */
export async function grantUserVipApi(id: number, days: number) {
  return requestClient.put(`/admin/users/${id}/vip/grant`, { days });
}

/**
 * 取消VIP
 */
export async function cancelUserVipApi(id: number) {
  return requestClient.put(`/admin/users/${id}/vip/cancel`);
}
