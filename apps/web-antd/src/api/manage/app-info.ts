import { requestClient } from '#/api/request';

export namespace AppInfoApi {
  /** 联系方式 */
  export interface ContactInfo {
    wechat: string;
    email: string;
    workTime: string;
  }

  /** 公告弹窗 */
  export interface Announcement {
    enabled: boolean;
    title: string;
    content: string;
    /**
     * 公告版本号。小程序按它判断要不要再弹一次：
     * 内容改了就把它 +1，所有用户会再看到一次；不改就每人只弹一次。
     */
    version: number;
  }

  /** 后端返回的原始形态，键名与 system_config 的 config_key 一致 */
  export interface AppInfo {
    app_name: string;
    /**
     * Logo 的相对路径（如 /uploads/2026/08/xxx.png）。
     * 后端只接受本站上传的地址，存的是 pathname，换域名不用刷数据。
     */
    app_logo: string;
    share_title: string;
    contact_info: ContactInfo;
    announcement: Announcement;
  }

  export interface UpdateItem {
    key: string;
    value: unknown;
  }
}

/**
 * 获取小程序信息配置
 */
export async function getAppInfoApi() {
  return requestClient.get<AppInfoApi.AppInfo>('/admin/app-info');
}

/**
 * 保存小程序信息配置（批量）
 *
 * 后端只接受白名单内的 key，传别的会被拒——
 * 这个接口和下载限额、VIP 定价共用 system_config 表，
 * 不能让它变成"任意写配置"的后门。
 */
export async function updateAppInfoApi(items: AppInfoApi.UpdateItem[]) {
  return requestClient.put('/admin/app-info', { items });
}
