import { Modal } from 'ant-design-vue';

interface CountdownConfirmOptions {
  /** 弹窗标题 */
  title: string;
  /** 弹窗正文 */
  content: string;
  /** 确认按钮文案（不含倒计时后缀，倒计时会自动追加） */
  okText: string;
  /** 取消按钮文案 */
  cancelText?: string;
  /** 倒计时秒数，默认 5 秒 */
  countdown?: number;
  /** 点击确认后执行 */
  onOk: () => Promise<void> | void;
}

/**
 * 带倒计时的危险操作确认框。
 *
 * 确认按钮在倒计时结束前是禁用的，逼使用者真正看一眼弹窗内容再点，
 * 用于"全部作废"这类范围大且不可撤销的操作。
 */
export function confirmWithCountdown(options: CountdownConfirmOptions): void {
  const {
    title,
    content,
    okText,
    cancelText = '取消',
    countdown = 5,
    onOk,
  } = options;

  let remaining = countdown;
  let timer: null | ReturnType<typeof setInterval> = null;

  const stopTimer = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  const instance = Modal.confirm({
    title,
    content,
    okType: 'danger',
    cancelText,
    okText: `${okText}（${remaining}s）`,
    okButtonProps: { disabled: true },
    onOk: async () => {
      stopTimer();
      await onOk();
    },
    onCancel: stopTimer,
    // 关闭时兜底清理：用户按 ESC 或点遮罩关闭时 onCancel 不一定触发
    afterClose: stopTimer,
  });

  timer = setInterval(() => {
    remaining -= 1;

    if (remaining > 0) {
      instance.update({ okText: `${okText}（${remaining}s）` });
      return;
    }

    stopTimer();
    instance.update({
      okText,
      okButtonProps: { disabled: false },
    });
  }, 1000);
}
