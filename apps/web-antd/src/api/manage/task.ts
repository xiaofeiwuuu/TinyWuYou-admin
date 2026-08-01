import { requestClient } from '#/api/request';

export namespace TaskManageApi {
  /** 任务列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    taskType?: string;
    status?: number; // isEnabled: 0禁用 1启用
  }

  /** 任务信息 */
  export interface TaskInfo {
    id: number;
    taskType: string; // newbie/signin/invite/ad
    taskName: string;
    taskDesc: string;
    rewardCount: number;
    dailyLimit: number; // 每日上限(0为不限)
    refreshType: 'once' | 'daily' | 'unlimited';
    isEnabled: number; // 0禁用 1启用
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: TaskInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 创建/更新任务 */
  /**
   * 更新任务配置。
   * taskType 不在其中：它是三端硬编码的分发 key，由系统固定。
   */
  export interface SaveParams {
    taskName: string;
    taskDesc?: string;
    rewardCount: number;
    dailyLimit?: number;
    refreshType: 'once' | 'daily' | 'unlimited';
    isEnabled?: number;
    sortOrder?: number;
  }
}

/**
 * 获取任务列表
 */
export async function getTaskListApi(params: TaskManageApi.ListParams) {
  return requestClient.get<TaskManageApi.ListResult>('/admin/tasks', { params });
}


/**
 * 更新任务
 */
export async function updateTaskApi(id: number, data: Partial<TaskManageApi.SaveParams>) {
  return requestClient.put(`/admin/tasks/${id}`, data);
}


/**
 * 切换任务状态
 */
export async function toggleTaskStatusApi(id: number, status: number) {
  return requestClient.put(`/admin/tasks/${id}/status`, { status });
}
