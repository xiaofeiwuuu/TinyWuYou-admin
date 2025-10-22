import { requestClient } from '#/api/request';

export namespace CollectionManageApi {
  /** 收藏记录列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    userKeyword?: string;
  }

  /** 收藏记录信息 */
  export interface CollectionInfo {
    id: number;
    userId: number;
    imageId: number;
    userNickname: string;
    userAvatar: string;
    imageTitle: string;
    imageUrl: string;
    thumbnailUrl: string;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: CollectionInfo[];
    total: number;
    page: number;
    pageSize: number;
  }
}

/**
 * 获取收藏记录列表
 */
export async function getCollectionListApi(params: CollectionManageApi.ListParams) {
  return requestClient.get<CollectionManageApi.ListResult>('/admin/user-collections', { params });
}
