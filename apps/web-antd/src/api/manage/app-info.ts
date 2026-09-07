import { requestClient } from '#/api/request';

export namespace AppInfoApi {
  /** 联系方式 */
  export interface ContactInfo {
    wechat: string;
    email: string;
    workTime: string;
  }

  /** 常见问题的一条 */
  export interface FaqItem {
    title: string;
    content: string;
  }

  /** 后端返回的原始形态，键名与 system_config 的 config_key 一致 */
  export interface AppInfo {
    app_name: string;
    /** 一句话标语，显示在关于我们页的名称下方 */
    app_slogan: string;
    /** 常见问题列表 */
    faq: FaqItem[];
    /**
     * Logo 的相对路径（如 /uploads/2026/08/xxx.png）。
     * 后端只接受本站上传的地址，存的是 pathname，换域名不用刷数据。
     */
    app_logo: string;
    share_title: string;
    contact_info: ContactInfo;
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
