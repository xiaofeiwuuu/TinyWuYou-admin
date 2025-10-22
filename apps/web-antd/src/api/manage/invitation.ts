import { requestClient } from '#/api/request';

export namespace InvitationManageApi {
  /** 邀请记录列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    inviterKeyword?: string;
    inviteeKeyword?: string;
  }

  /** 邀请记录信息 */
  export interface InvitationInfo {
    id: number;
    inviterId: number;
    inviteeId: number;
    inviterNickname: string;
    inviterAvatar: string;
    inviteeNickname: string;
    inviteeAvatar: string;
    rewardCount: number;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: InvitationInfo[];
    total: number;
    page: number;
    pageSize: number;
  }
}

/**
 * 获取邀请记录列表
 */
export async function getInvitationListApi(params: InvitationManageApi.ListParams) {
  return requestClient.get<InvitationManageApi.ListResult>('/admin/user-invitations', { params });
}
