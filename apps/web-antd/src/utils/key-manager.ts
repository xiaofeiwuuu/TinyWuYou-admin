import { CryptoUtil } from './crypto';
import { requestClient } from '#/api/request';

/**
 * 前端密钥管理器
 * 负责与服务端进行密钥交换和管理本地密钥
 */
class KeyManager {
  private clientId: string;
  private clientRsaKeys: { publicKey: string; privateKey: string } | null = null;
  private aesKey: string | null = null;
  private serverPublicKey: string | null = null;
  private isExchanging: boolean = false;

  constructor() {
    // 生成或获取客户端 ID
    this.clientId = this.getOrCreateClientId();
    // 尝试从 localStorage 恢复 AES 密钥
    this.aesKey = localStorage.getItem('__aes_key__');
  }

  /**
   * 获取或创建客户端 ID
   */
  private getOrCreateClientId(): string {
    const storageKey = '__client_id__';
    let clientId = localStorage.getItem(storageKey);

    if (!clientId) {
      clientId = CryptoUtil.generateRandomId(32);
      localStorage.setItem(storageKey, clientId);
    }

    return clientId;
  }

  /**
   * 获取客户端 ID
   */
  getClientId(): string {
    return this.clientId;
  }

  /**
   * 获取 AES 密钥
   */
  getAesKey(): string | null {
    return this.aesKey;
  }

  /**
   * 是否已完成密钥交换
   */
  isKeyExchanged(): boolean {
    return this.aesKey !== null;
  }

  /**
   * 与服务端进行密钥交换 (RSA 加密方式)
   *
   * 流程:
   * 1. 获取服务端公钥
   * 2. 客户端生成 AES 密钥
   * 3. 使用服务端公钥加密 AES 密钥
   * 4. 发送加密后的 AES 密钥给服务端
   * 5. 服务端使用私钥解密并存储客户端 AES 密钥
   */
  async exchangeKey(): Promise<void> {
    // 防止重复交换
    if (this.isExchanging) {
      return;
    }

    if (this.isKeyExchanged()) {
      return;
    }

    this.isExchanging = true;

    try {
      // 步骤 1: 获取服务端公钥
      const publicKeyResponse = await requestClient.get<{
        publicKey: string;
      }>('/auth/public-key');

      if (!publicKeyResponse || !publicKeyResponse.publicKey) {
        throw new Error('获取服务端公钥失败');
      }

      this.serverPublicKey = publicKeyResponse.publicKey;

      // 步骤 2: 生成客户端 AES 密钥 (256-bit)
      this.aesKey = CryptoUtil.generateAesKey();

      // 步骤 3: 使用服务端公钥加密 AES 密钥
      const encryptedAesKey = await CryptoUtil.rsaEncrypt(this.aesKey, this.serverPublicKey);

      // 步骤 4: 发送加密后的 AES 密钥给服务端
      const response = await requestClient.post<{
        success: boolean;
      }>('/auth/exchange-key', {
        clientId: this.clientId,
        encryptedAesKey,
      });

      if (!response || !response.success) {
        throw new Error('服务端密钥交换失败');
      }

      // 保存 AES 密钥到 localStorage
      localStorage.setItem('__aes_key__', this.aesKey);

    } catch (error) {
      console.error('[KeyManager] ❌ 密钥交换失败:', error);
      // 失败时清除密钥
      this.aesKey = null;
      this.serverPublicKey = null;
      throw error;
    } finally {
      this.isExchanging = false;
    }
  }

  /**
   * 清除密钥（退出登录时调用）
   */
  clearKeys(): void {
    this.clientRsaKeys = null;
    this.aesKey = null;
    this.serverPublicKey = null;
    // 清除 localStorage 中的密钥
    localStorage.removeItem('__aes_key__');
  }
}

// 导出单例
export const keyManager = new KeyManager();
