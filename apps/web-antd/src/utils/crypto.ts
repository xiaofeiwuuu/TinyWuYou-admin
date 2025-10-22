import CryptoJS from 'crypto-js';
import JSEncrypt from 'jsencrypt';

/**
 * 前端加密工具类
 * 使用 RSA + AES 混合加密
 */
export class CryptoUtil {
  /**
   * 生成 RSA 密钥对
   */
  static generateRsaKeyPair(): { publicKey: string; privateKey: string } {
    const encrypt = new JSEncrypt({ default_key_size: '2048' });
    const privateKey = encrypt.getPrivateKey();
    const publicKey = encrypt.getPublicKey();

    return {
      publicKey,
      privateKey,
    };
  }

  /**
   * RSA 加密 (使用 OAEP 填充)
   * OAEP 比 PKCS1 更安全,且 Node.js 新版本要求使用 OAEP
   */
  static rsaEncrypt(data: string, publicKey: string): Promise<string> {
    // jsencrypt 默认使用 PKCS1,但我们需要 OAEP
    // 由于 jsencrypt 不直接支持 OAEP,我们使用原生 Web Crypto API
    return this.rsaEncryptWithOAEP(data, publicKey);
  }

  /**
   * 使用 Web Crypto API 进行 RSA-OAEP 加密
   */
  private static async rsaEncryptWithOAEP(data: string, publicKey: string): Promise<string> {
    // 解析 PEM 格式的公钥
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = publicKey
      .replace(pemHeader, '')
      .replace(pemFooter, '')
      .replace(/\s/g, '');

    // Base64 解码
    const binaryDer = atob(pemContents);
    const bytes = new Uint8Array(binaryDer.length);
    for (let i = 0; i < binaryDer.length; i++) {
      bytes[i] = binaryDer.charCodeAt(i);
    }

    // 导入公钥
    const cryptoKey = await window.crypto.subtle.importKey(
      'spki',
      bytes.buffer,
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256',
      },
      false,
      ['encrypt'],
    );

    // 加密数据
    const encoder = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP',
      },
      cryptoKey,
      encoder.encode(data),
    );

    // 转换为 Base64
    const encryptedArray = new Uint8Array(encrypted);
    let binary = '';
    for (let i = 0; i < encryptedArray.length; i++) {
      binary += String.fromCharCode(encryptedArray[i]);
    }
    return btoa(binary);
  }

  /**
   * RSA 解密
   */
  static rsaDecrypt(encrypted: string, privateKey: string): string {
    const decrypt = new JSEncrypt();
    decrypt.setPrivateKey(privateKey);
    const decrypted = decrypt.decrypt(encrypted);

    if (!decrypted) {
      throw new Error('RSA 解密失败');
    }

    return decrypted;
  }

  /**
   * AES 加密
   * 使用 AES-256-CBC
   */
  static aesEncrypt(data: string, key: string): string {
    try {
      // 将密钥转换为 WordArray (key是hex字符串)
      const keyWordArray = CryptoJS.enc.Hex.parse(key);

      // 生成随机 IV
      const iv = CryptoJS.lib.WordArray.random(16);

      // 加密
      const encrypted = CryptoJS.AES.encrypt(data, keyWordArray, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // 将 IV 和密文组合返回 (IV:密文)
      return `${iv.toString(CryptoJS.enc.Base64)}:${encrypted.toString()}`;
    } catch (error) {
      console.error('[CryptoUtil] AES 加密失败:', error);
      throw new Error('AES 加密失败');
    }
  }

  /**
   * AES 解密
   */
  static aesDecrypt(encrypted: string, key: string): string {
    try {
      // 将密钥转换为 WordArray (key是hex字符串)
      const keyWordArray = CryptoJS.enc.Hex.parse(key);

      // 分离 IV 和密文
      const [ivBase64, ciphertext] = encrypted.split(':');
      const iv = CryptoJS.enc.Base64.parse(ivBase64);

      // 解密
      const decrypted = CryptoJS.AES.decrypt(ciphertext, keyWordArray, {
        iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('[CryptoUtil] AES 解密失败:', error);
      throw new Error('AES 解密失败');
    }
  }

  /**
   * 生成 AES 密钥 (256-bit / 32 bytes)
   * 返回 64 位 hex 字符串
   */
  static generateAesKey(): string {
    const randomBytes = CryptoJS.lib.WordArray.random(32);
    return randomBytes.toString(CryptoJS.enc.Hex);
  }

  /**
   * 生成随机字符串（用于客户端 ID）
   */
  static generateRandomId(length: number = 16): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
