import { requestClient } from '#/api/request';

export namespace OperationLogApi {
  export interface OperationLogInfo {
    id: number;
    adminId: number;
    adminUsername: string;
    module: string;
    action: string;
    method: string;
    path: string;
    params: string;
    ip: string;
    userAgent: string;
    statusCode: number;
    errorMessage: string;
    duration: number;
    createdAt: string;
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
