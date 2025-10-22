import { requestClient } from '#/api/request';

export namespace AdminUserApi {
  export interface AdminUserInfo {
    id: number;
    username: string;
    realName: string;
    avatar: string;
    role: string;
    email: string;
    phone: string;
    lastLoginTime: string;
    lastLoginIp: string;
    status: number;
    createdAt: string;
    updatedAt: string;
  }

  export interface GetAdminUserListParams {
    role?: string;
    status?: number;
    page: number;
    pageSize: number;
  }

  export interface GetAdminUserListResult {
    list: AdminUserInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  export interface CreateAdminUserDto {
    username: string;
    password: string;
    realName: string;
    avatar?: string;
    role: string;
    email?: string;
    phone?: string;
  }

  export interface UpdateAdminUserDto {
    realName?: string;
    avatar?: string;
    role?: string;
    email?: string;
    phone?: string;
    status?: number;
  }
}

/**
 * 获取管理员列表
 */
export async function getAdminUserListApi(
  params: AdminUserApi.GetAdminUserListParams,
) {
  return requestClient.get<AdminUserApi.GetAdminUserListResult>(
    '/admin/admin-users',
    { params },
  );
}

/**
 * 创建管理员
 */
export async function createAdminUserApi(data: AdminUserApi.CreateAdminUserDto) {
  return requestClient.post<AdminUserApi.AdminUserInfo>('/admin/admin-users', data);
}

/**
 * 更新管理员
 */
export async function updateAdminUserApi(
  id: number,
  data: AdminUserApi.UpdateAdminUserDto,
) {
  return requestClient.put<AdminUserApi.AdminUserInfo>(`/admin/admin-users/${id}`, data);
}

/**
 * 删除管理员
 */
export async function deleteAdminUserApi(id: number) {
  return requestClient.delete(`/admin/admin-users/${id}`);
}

/**
 * 重置管理员密码
 */
export async function resetAdminPasswordApi(id: number, password: string) {
  return requestClient.post(`/admin/admin-users/${id}/reset-password`, { password });
}

/**
 * 更新管理员状态
 */
export async function updateAdminStatusApi(id: number, status: number) {
  return requestClient.put(`/admin/admin-users/${id}/status`, { status });
}
