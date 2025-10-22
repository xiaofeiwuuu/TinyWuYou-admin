/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'ant-design-vue';

import { useAuthStore } from '#/store';
import { keyManager } from '#/utils/key-manager';
import { CryptoUtil } from '#/utils/crypto';

import { refreshTokenApi } from './core';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

// 防止退出登录时的无限循环
let isLoggingOut = false;

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑
   */
  async function doReAuthenticate() {
    // 防止退出登录时的无限循环
    if (isLoggingOut) {
      console.warn('Already logging out, skip re-authentication');
      return;
    }

    console.warn('Access token or refresh token is invalid or expired. ');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    if (
      preferences.app.loginExpiredMode === 'modal' &&
      accessStore.isAccessChecked
    ) {
      accessStore.setLoginExpired(true);
    } else {
      isLoggingOut = true;
      try {
        await authStore.logout();
      } finally {
        isLoggingOut = false;
      }
    }
  }

  /**
   * 刷新token逻辑
   */
  async function doRefreshToken() {
    const accessStore = useAccessStore();
    const resp = await refreshTokenApi();
    const newToken = resp.data;
    accessStore.setAccessToken(newToken);
    return newToken;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;

      // 添加客户端 ID 到请求头
      config.headers['x-client-id'] = keyManager.getClientId();

      return config;
    },
  });

  // 请求加密拦截器
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      // 跳过不需要加密的路由（密钥交换、登录、退出登录、文件上传等）
      const skipRoutes = ['/auth/exchange-key', '/auth/public-key', '/auth/admin/login', '/auth/wx-login', '/auth/logout', '/upload'];
      const url = config.url || '';

      if (skipRoutes.some((route) => url.includes(route))) {
        return config;
      }

      // 确保已完成密钥交换(最多重试一次)
      let retryCount = 0;
      while (!keyManager.isKeyExchanged() && retryCount < 2) {
        try {
          console.log(`[Request] 开始密钥交换 (尝试 ${retryCount + 1}/2)`);
          await keyManager.exchangeKey();
        } catch (error) {
          retryCount++;
          if (retryCount >= 2) {
            console.error('[Request] 密钥交换失败，请求将不加密');
            return config;
          }
          // 交换失败,清除旧 clientId 和密钥重试
          console.warn('[Request] 密钥交换失败，清除 clientId 和密钥重试');
          localStorage.removeItem('__client_id__');
          localStorage.removeItem('__aes_key__');
          keyManager.clearKeys();
        }
      }

      // 加密请求数据
      const aesKey = keyManager.getAesKey();
      if (aesKey && config.data) {
        try {
          const encrypted = CryptoUtil.aesEncrypt(
            JSON.stringify(config.data),
            aesKey,
          );
          config.data = { encrypted };
          console.log(`[Request] ✅ 加密请求数据: ${url}`);
        } catch (error) {
          console.error('[Request] 加密失败:', error);
        }
      }

      return config;
    },
  });

  // 响应解密拦截器（在处理响应数据格式之前）
  client.addResponseInterceptor({
    fulfilled: async (response) => {
      const skipRoutes = ['/auth/exchange-key', '/auth/public-key', '/auth/admin/login', '/auth/wx-login', '/auth/logout', '/upload'];
      const url = response.config.url || '';

      // 跳过不需要解密的路由
      if (skipRoutes.some((route) => url.includes(route))) {
        return response;
      }

      // 检查响应是否加密
      if (response.data?.encrypted) {
        const aesKey = keyManager.getAesKey();
        if (!aesKey) {
          console.warn('[Response] 收到加密响应但本地无密钥，清除所有缓存');
          // 清除 clientId 和密钥,这样下次会生成新的并重新交换
          localStorage.removeItem('__client_id__');
          localStorage.removeItem('__aes_key__');
          keyManager.clearKeys();
          // 返回原始响应,让业务层处理错误
          return response;
        }

        try {
          const decryptedData = CryptoUtil.aesDecrypt(
            response.data.encrypted,
            aesKey,
          );
          response.data = JSON.parse(decryptedData);
          console.log(`[Response] ✅ 解密响应数据: ${url}`);
        } catch (error) {
          console.error('[Response] 解密失败，清除所有缓存:', error);
          // 解密失败,清除所有缓存
          localStorage.removeItem('__client_id__');
          localStorage.removeItem('__aes_key__');
          keyManager.clearKeys();
          // 返回原始响应,让业务层处理错误
          return response;
        }
      }

      return response;
    },
    rejected: async (error) => {
      // 处理 428 密钥过期错误
      if (error?.response?.status === 428 || error?.response?.data?.needKeyExchange) {
        console.warn('[Response Error] 服务端密钥已过期，使用原 clientId 重新交换密钥');
        // 清除本地 AES 密钥(保留 clientId)
        keyManager.clearKeys();
        // 重新进行密钥交换(使用同一个 clientId)
        try {
          await keyManager.exchangeKey();
          console.log('[Response Error] 密钥交换成功，刷新页面');
          // 刷新页面以重新加载所有数据
          window.location.reload();
          // 返回一个永远不会 resolve 的 Promise，防止后续代码执行
          return new Promise(() => {});
        } catch (exchangeError) {
          console.error('[Response Error] 密钥交换失败:', exchangeError);
          return Promise.reject(exchangeError);
        }
      }
      // 继续抛出错误
      return Promise.reject(error);
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 这里可以根据业务进行定制,你可以拿到 error 内的信息进行定制化处理，根据不同的 code 做不同的提示，而不是直接使用 message.error 提示 msg
      // 当前mock接口返回的错误字段是 error 或者 message
      const responseData = error?.response?.data ?? {};
      const errorMessage = responseData?.error ?? responseData?.message ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
