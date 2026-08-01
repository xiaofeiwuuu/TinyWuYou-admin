import { requestClient } from '#/api/request';

export namespace ImageTypeApi {
  /** 图片朝向，决定客户端列表布局 */
  export type Orientation = 'landscape' | 'portrait' | 'square';

  export interface ImageTypeInfo {
    id: number;
    /** 类型标识，images / categories 里存的就是它，创建后不可改 */
    code: string;
    name: string;
    orientation: Orientation;
    color: string;
    /** 热度分权重：hot_score = 下载数 * downloadWeight + 收藏数 * collectWeight */
    downloadWeight: number;
    collectWeight: number;
    sortOrder: number;
    isEnabled: number;
    createdAt: string;
    /** 该类型下的图片数（用于判断能否删除） */
    imageCount: number;
    /** 该类型下的分类数 */
    categoryCount: number;
  }

  export interface ListResult {
    list: ImageTypeInfo[];
    total: number;
  }

  /** 新建时需要 code，编辑时不允许改 */
  export interface CreateParams {
    code: string;
    name: string;
    orientation: Orientation;
    color?: string;
    downloadWeight?: number;
    collectWeight?: number;
    sortOrder?: number;
    isEnabled?: number;
  }

  export type UpdateParams = Omit<CreateParams, 'code'>;
}

export async function getImageTypeListApi() {
  return requestClient.get<ImageTypeApi.ListResult>('/admin/image-types');
}

export async function createImageTypeApi(data: ImageTypeApi.CreateParams) {
  return requestClient.post('/admin/image-types', data);
}

export async function updateImageTypeApi(
  id: number,
  data: ImageTypeApi.UpdateParams,
) {
  return requestClient.put(`/admin/image-types/${id}`, data);
}

export async function deleteImageTypeApi(id: number) {
  return requestClient.delete(`/admin/image-types/${id}`);
}
