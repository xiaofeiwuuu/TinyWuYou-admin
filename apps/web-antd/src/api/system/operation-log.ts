import { requestClient } from '#/api/request';

export namespace OperationLogApi {
  export interface OperationLogInfo {
    id: number;
    adminId: number;
    adminUsername: string;
    /** 模块标识，如 vip-cards */
    module: string;
    /** 模块中文名，由后端字典给出 */
    moduleLabel: string;
    /** 操作类型原值(create/update/delete)，筛选用 */
    action: string;
    /** 操作中文名，如「批量作废」——按路由语义判断，不是简单翻译 HTTP 方法 */
    actionLabel: string;
    method: string;
    path: string;
    params: string;
    /** 人话版说明，如「VIP卡密 - 作废 2 张卡密」 */
    remark: string;
    ip: string;
    userAgent: string;
    statusCode: number;
    errorMessage: string;
    duration: number;
    createdAt: string;
  }

  export interface FilterOption {
    label: string;
    value: string;
  }

  export interface FilterOptions {
    /** 日志里真实出现过的管理员 */
    admins: FilterOption[];
    /** 模块，value 可能是逗号分隔的多个 code */
    modules: FilterOption[];
  }

  export interface GetOperationLogListParams {
    adminId?: number;
    action?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
    page: number;
    pageSize: number;
  }

  export interface GetOperationLogListResult {
    list: OperationLogInfo[];
    total: number;
    page: number;
    pageSize: number;
  }
}

/**
 * 获取操作日志列表
 */
export async function getOperationLogListApi(
  params: OperationLogApi.GetOperationLogListParams,
) {
  return requestClient.get<OperationLogApi.GetOperationLogListResult>(
    '/admin/operation-logs',
    { params },
  );
}

/**
 * 筛选下拉项（模块 + 管理员）。中文名来自后端字典，前端不再单独维护一份映射。
 */
export async function getOperationLogFiltersApi() {
  return requestClient.get<OperationLogApi.FilterOptions>(
    '/admin/operation-logs/filters',
  );
}
