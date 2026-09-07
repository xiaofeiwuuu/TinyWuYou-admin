import { requestClient } from '#/api/request';

export namespace InvitationManageApi {
  /** 邀请记录列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    /** 邀请人 UID（远程搜索） */
    inviterUid?: string;
    /** 被邀请人 UID（远程搜索） */
    inviteeUid?: string;
  }

  /** 邀请记录信息 */
  export interface InvitationInfo {
    id: number;
    inviterId: number;
    inviteeId: number;
    /** 对外 UID */
    inviterUid: null | string;
    inviterNickname: string;
    inviterAvatar: string;
    inviteeUid: null | string;
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
