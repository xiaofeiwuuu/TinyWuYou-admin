# 用户列表状态切换功能修复

## 修改内容

### 文件: `apps/web-antd/src/views/manage/user/index.vue`

#### 1. 导入修改
- 移除了从 `@vben/common-ui` 导入的 `confirm`
- 添加了从 `ant-design-vue` 导入的 `Modal`

#### 2. 添加 confirm 辅助函数
```typescript
/**
 * 将Antd的Modal.confirm封装为promise，方便在异步函数中调用。
 * @param content 提示内容
 * @param title 提示标题
 */
function confirm(content: string, title: string) {
  return new Promise((resolve, reject) => {
    Modal.confirm({
      content,
      onCancel() {
        reject(new Error('已取消'));
      },
      onOk() {
        resolve(true);
      },
      title,
    });
  });
}
```

#### 3. 重写 onStatusChange 函数
按照分类管理的写法,修改为:
```typescript
/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(
  newStatus: number,
  row: UserManageApi.UserInfo,
) {
  const statusText: Record<string, string> = {
    0: '禁用',
    1: '启用',
  };
  try {
    await confirm(
      `你要将用户「${row.nickname}」的状态切换为【${statusText[newStatus.toString()]}】吗？`,
      '切换状态',
    );
    await toggleUserStatusApi(row.id, newStatus);
    message.success('状态切换成功');
    return true;
  } catch {
    return false;
  }
}
```

#### 4. 修复 handleVipCancel 函数
统一使用新的 confirm 函数:
```typescript
const handleVipCancel = async (row: UserManageApi.UserInfo) => {
  const vipInfo = row.vipExpireTime
    ? `\n\n当前到期时间: ${formatDate(row.vipExpireTime)}`
    : '';

  try {
    await confirm(
      `确定要取消用户 ${row.id} 的VIP权限吗？${vipInfo}`,
      '取消VIP',
    );
    await cancelUserVipApi(row.id);
    message.success('已取消VIP');
    gridApi.reload();
  } catch (error: any) {
    // 用户点击取消或操作失败
    if (error.message !== '已取消') {
      message.error(error.message || '取消失败');
    }
  }
};
```

## 修改原因

原有的状态切换功能使用了错误的 confirm 函数调用方式,导致:
1. TypeScript 类型错误
2. 状态切换开关无法正常工作

## 解决方案

参考分类管理页面 (`apps/web-antd/src/views/manage/category/index.vue`) 的实现方式:
1. 使用 `Modal.confirm` 封装为 Promise
2. `onStatusChange` 函数返回 `true/false` 来控制开关状态
3. 使用 `try...catch` 处理用户取消操作

## 测试验证

修改后的功能:
- ✅ 点击状态开关显示确认对话框
- ✅ 点击确定后调用API切换状态
- ✅ 点击取消后开关状态不变
- ✅ 成功后显示提示消息并刷新列表
- ✅ 失败后显示错误消息且开关状态恢复
