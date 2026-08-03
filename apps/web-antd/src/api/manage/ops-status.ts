import { requestClient } from '#/api/request';

export namespace OpsStatusApi {
  export interface Status {
    /** ok | failed | unknown */
    status: string;
    message: string;
    detail: Record<string, any>;
    /** ISO 时间；从未上报过时为 null */
    reportedAt: null | string;
  }

  export interface AllStatus {
    cert: Status;
  }
}

/**
 * 获取运维状态（证书续期等定时任务的上次执行结果）
 */
export async function getOpsStatusApi() {
  return requestClient.get<OpsStatusApi.AllStatus>('/admin/ops/status');
}
