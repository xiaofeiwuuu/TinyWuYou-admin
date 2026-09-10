import { requestClient } from '#/api/request';

export namespace AnnouncementApi {
  export interface ListParams {
    page?: number;
    pageSize?: number;
  }

  export interface Info {
    id: number;
    title: string;
    content: string;
    isEnabled: number; // 1 启用 0 禁用
    /** 发布时间(空=立即生效) / 结束时间(空=长期有效) */
    publishTime: null | string;
    endTime: null | string;
    createdAt: string;
  }

  export interface ListResult {
    list: Info[];
    total: number;
    page: number;
    pageSize: number;
  }

  export interface SaveParams {
    title: string;
    content: string;
    isEnabled?: number;
    /** YYYY-MM-DD HH:mm:ss，空/null 表示不限制 */
    publishTime?: null | string;
    endTime?: null | string;
  }
}

/** 公告列表（分页，保留全部历史） */
export async function getAnnouncementListApi(params: AnnouncementApi.ListParams) {
  return requestClient.get<AnnouncementApi.ListResult>('/admin/announcements', {
    params,
  });
}

export async function createAnnouncementApi(data: AnnouncementApi.SaveParams) {
  return requestClient.post('/admin/announcements', data);
}

export async function updateAnnouncementApi(
  id: number,
  data: Partial<AnnouncementApi.SaveParams>,
) {
  return requestClient.post(`/admin/announcements/${id}`, data);
}

export async function deleteAnnouncementApi(id: number) {
  return requestClient.post(`/admin/announcements/${id}/delete`);
}
