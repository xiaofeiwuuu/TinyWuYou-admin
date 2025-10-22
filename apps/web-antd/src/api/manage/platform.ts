import { requestClient } from '#/api/request';

export namespace PlatformManageApi {
  /** 平台配置信息 */
  export interface PlatformConfig {
    id: number;
    platform: string;
    platformName: string;
    appId: string;
    appSecret: string;
    isEnabled: number;
    extraConfig: string | null;
    createdAt: string;
    updatedAt: string;
  }

  /** 更新平台配置参数 */
  export interface UpdatePlatformDto {
    platform: string;
    platformName: string;
    appId: string;
    appSecret: string;
    isEnabled?: number;
    extraConfig?: string;
  }
}

/**
 * 获取所有平台配置列表
 */
export async function getPlatformListApi() {
  return requestClient.get<PlatformManageApi.PlatformConfig[]>('/admin/platforms');
}

/**
 * 获取单个平台配置
 */
export async function getPlatformConfigApi(platform: string) {
  return requestClient.get<PlatformManageApi.PlatformConfig>(`/admin/platforms/${platform}`);
}

/**
 * 批量更新平台配置
 */
export async function updatePlatformsApi(platforms: PlatformManageApi.UpdatePlatformDto[]) {
  return requestClient.put('/admin/platforms', { platforms });
}
