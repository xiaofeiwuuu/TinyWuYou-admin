import { requestClient } from '#/api/request';

export namespace SystemConfigApi {
  export interface Config {
    id: number;
    configKey: string;
    configValue: string;
    configType: string;
    description: string;
    createdAt: string;
    updatedAt: string;
  }

  export interface UpdateConfigDto {
    configKey: string;
    configValue: string;
    configDesc?: string;
    valueType?: string;
  }
}

/**
 * 获取所有系统配置
 */
export async function getSystemConfigListApi() {
  return requestClient.get<SystemConfigApi.Config[]>('/admin/system-config/list');
}

/**
 * 更新系统配置
 */
export async function updateSystemConfigApi(data: SystemConfigApi.UpdateConfigDto) {
  return requestClient.post('/admin/system-config/update', data);
}
