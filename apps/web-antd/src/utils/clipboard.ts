import { message } from 'ant-design-vue';

/**
 * 复制文本到剪贴板。
 *
 * navigator.clipboard 只在**安全上下文**下可用——也就是 https://、
 * localhost 或 127.0.0.1。通过局域网 IP 或 http:// 访问后台时，
 * `navigator.clipboard` 直接是 undefined，所以必须有降级路径，
 * 否则内网部署的后台点复制不会有任何反应。
 *
 * @returns 是否复制成功
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!text) {
    return false;
  }

  // 优先走标准 API
  if (window.isSecureContext && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 用户拒绝授权、或浏览器在非用户手势里限制了写入，落到下面的兜底
    }
  }

  return legacyCopy(text);
}

/**
 * document.execCommand('copy') 兜底。
 *
 * 这个 API 已被标记为废弃，但它是 http 环境下唯一还能用的方案，
 * 目前所有主流浏览器仍然支持。
 */
function legacyCopy(text: string): boolean {
  const textarea = document.createElement('textarea');
  textarea.value = text;

  // 不能用 display:none 或 visibility:hidden —— 那样元素不可选中，select() 不生效。
  // 只能把它移出视口。
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '-9999px';
  textarea.style.opacity = '0';
  // 只读可以避免移动端弹出软键盘
  textarea.setAttribute('readonly', '');
  document.body.append(textarea);

  // 记下用户原本选中的内容，复制完还原回去
  const selection = document.getSelection();
  const previousRange =
    selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  try {
    textarea.select();
    // iOS Safari 上 select() 不够，必须显式指定范围
    textarea.setSelectionRange(0, textarea.value.length);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    textarea.remove();
    if (selection && previousRange) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
  }
}

/**
 * 复制并给出提示。列表里点一下就复制的场景直接用这个。
 */
export async function copyWithTip(
  text: string,
  successText = '已复制',
): Promise<boolean> {
  const ok = await copyToClipboard(text);

  if (ok) {
    message.success(successText);
  } else {
    message.error('复制失败，请手动选中后复制');
  }

  return ok;
}
