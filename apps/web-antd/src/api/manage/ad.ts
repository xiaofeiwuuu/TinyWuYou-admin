import { requestClient } from '#/api/request';

export namespace AdManageApi {
  /** 广告配置 */
  export interface AdConfig {
    video: string;
    interstitial: string;
    native: string;
  }

  /** 更新广告配置参数 */
  export interface UpdateParams {
    video?: string;
    interstitial?: string;
    native?: string;
  }
}

/**
 * 获取广告配置
 */
export async function getAdConfigApi() {
  return requestClient.get<AdManageApi.AdConfig>('/admin/ads');
}

/**
 * 更新广告配置
 */
export async function updateAdConfigApi(data: AdManageApi.UpdateParams) {
  return requestClient.put('/admin/ads', data);
}
