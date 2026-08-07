import { requestClient } from '#/api/request';

export namespace BannerApi {
  export interface BannerInfo {
    id: number;
    /** 完整预览地址（后端已拼成 CDN 地址，仅用于展示） */
    imageUrl: string;
    /** 相对路径原值，回填 Upload / 提交时用 */
    imageUrlRaw: string;
    /** 跳转目标分类，null=不跳 */
    categoryId: null | number;
    categoryName: null | string;
    sortOrder: number;
    isEnabled: number;
    createdAt: string;
  }

  export interface ListResult {
    list: BannerInfo[];
  }

  export interface SaveParams {
    imageUrl: string;
    categoryId?: number;
    sortOrder?: number;
    isEnabled?: number;
  }
}

export async function getBannerListApi() {
  return requestClient.get<BannerApi.ListResult>('/admin/banners');
}

export async function createBannerApi(data: BannerApi.SaveParams) {
  return requestClient.post('/admin/banners', data);
}

export async function updateBannerApi(
  id: number,
  // 更新时字段全可选：既支持整表提交，也支持列表里只改状态。后端 DTO 本来就全可选。
  data: Partial<BannerApi.SaveParams>,
) {
  return requestClient.put(`/admin/banners/${id}`, data);
}

export async function deleteBannerApi(id: number) {
  return requestClient.delete(`/admin/banners/${id}`);
}
