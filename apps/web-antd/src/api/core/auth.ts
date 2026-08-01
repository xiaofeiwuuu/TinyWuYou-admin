import { baseRequestClient, requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    accessToken: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }

  /** 修改密码接口参数 */
  export interface ChangePasswordParams {
    oldPassword: string;
    newPassword: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  // 只提交接口声明的字段。
  // 登录表单里还有 vben 的滑块验证 captcha，那是纯前端的人机校验（一个布尔值），
  // 对服务端没有任何意义；而 authLogin 的入参类型是 Recordable<any>，
  // 整个表单值会被原样透传，TS 也拦不住。
  const { username, password } = data;
  return requestClient.post<AuthApi.LoginResult>('/auth/admin/login', {
    username,
    password,
  });
}

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return baseRequestClient.post<AuthApi.RefreshTokenResult>('/auth/refresh', {
    withCredentials: true,
  });
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return requestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 修改密码
 */
export async function changePasswordApi(data: AuthApi.ChangePasswordParams) {
  return requestClient.put('/auth/admin/change-password', data);
}
