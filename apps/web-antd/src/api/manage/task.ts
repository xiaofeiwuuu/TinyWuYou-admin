import { requestClient } from '#/api/request';

export namespace TaskManageApi {
  /** 任务列表参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    keyword?: string;
  }

  /** 任务信息 */
  export interface TaskInfo {
    id: number;
    taskType: string;
    taskName: string;
    description: string;
    requiredCount: number;
    rewardType: string;
    rewardValue: number;
    iconUrl: string;
    sortOrder: number;
    status: number;
    createdAt: string;
  }

  /** 列表返回 */
  export interface ListResult {
    list: TaskInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 创建/更新任务 */
  export interface SaveParams {
    taskType: string;
    taskName: string;
    description?: string;
    requiredCount: number;
    rewardType: string;
    rewardValue: number;
    iconUrl?: string;
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
 * 创建任务
 */
export async function createTaskApi(data: TaskManageApi.SaveParams) {
  return requestClient.post('/admin/tasks', data);
}

/**
 * 更新任务
 */
export async function updateTaskApi(id: number, data: TaskManageApi.SaveParams) {
  return requestClient.put(`/admin/tasks/${id}`, data);
}

/**
 * 删除任务
 */
export async function deleteTaskApi(id: number) {
  return requestClient.delete(`/admin/tasks/${id}`);
}

/**
 * 切换任务状态
 */
export async function toggleTaskStatusApi(id: number, status: number) {
  return requestClient.put(`/admin/tasks/${id}/status`, { status });
}
