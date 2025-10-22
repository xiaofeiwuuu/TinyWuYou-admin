<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { Page, prompt, confirm } from '@vben/common-ui';
import { useAccess } from '@vben/access';
import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getUserListApi,
  toggleUserStatusApi,
  updateUserDownloadCountApi,
  updateUserRemarkApi,
  cancelUserVipApi,
  type UserManageApi,
} from '#/api/manage/user';
import {
  Input,
  InputNumber,
  message,
  Dropdown,
  Menu,
  MenuItem,
} from 'ant-design-vue';
import { h, ref } from 'vue';
import VipForm from './modules/vip-form.vue';

const { TextArea } = Input;

// 权限检查
const { hasAccessByCodes } = useAccess();
const canEdit = hasAccessByCodes(['user:edit']);

// VIP管理表单组件引用
const vipGrantFormRef = ref<InstanceType<typeof VipForm>>();
const vipRenewFormRef = ref<InstanceType<typeof VipForm>>();

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-5',
  schema: [
    {
      component: 'Input',
      fieldName: 'id',
      label: 'ID',
      componentProps: {
        placeholder: '用户ID',
      },
    },
    {
      component: 'Input',
      fieldName: 'keyword',
      label: '搜索',
      componentProps: {
        placeholder: '昵称/OpenID',
      },
    },
    {
      component: 'Select',
      fieldName: 'userLevel',
      label: '用户等级',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: 'LV1 (0-50)', value: 1 },
          { label: 'LV2 (51-200)', value: 2 },
          { label: 'LV3 (201-500)', value: 3 },
          { label: 'LV4 (500+)', value: 4 },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'isVip',
      label: 'VIP状态',
      componentProps: {
        allowClear: true,
        placeholder: '全部',
        options: [
          { label: '非VIP', value: 0 },
          { label: 'VIP用户', value: 1 },
        ],
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const getLevelColor = (level: number) => {
  const colors = ['', 'blue', 'green', 'orange', 'red'];
  return colors[level] || 'default';
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return new Date(date).toLocaleString('zh-CN');
};

// 状态切换前的确认
async function onStatusChange(newStatus: number, row: UserManageApi.UserInfo) {
  const statusText: Record<string, string> = { 0: '禁用', 1: '启用' };
  return new Promise<boolean>((resolve, reject) => {
    confirm({
      title: '切换状态',
      content: `确定要将用户「${row.nickname}」的状态切换为【${statusText[newStatus]}】吗？`,
      onOk: async () => {
        try {
          await toggleUserStatusApi(row.id, newStatus);
          message.success('状态切换成功');
          resolve(true);
        } catch (error) {
          message.error('状态切换失败');
          reject(error);
        }
      },
      onCancel: () => {
        reject(new Error('已取消'));
      },
    });
  });
}

const gridOptions: VxeTableGridOptions<UserManageApi.UserInfo> = {
  columns: [
    { title: 'ID', field: 'id', width: 80 },
    // { title: '序号', type: 'seq', width: 50 },
    // {
    //   title: '头像',
    //   field: 'avatarUrl',
    //   width: 80,
    //   slots: {
    //     default: ({ row }) => {
    //       return h('img', {
    //         src: row.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + row.nickname,
    //         style: 'width: 40px; height: 40px; border-radius: 50%; object-fit: cover',
    //       });
    //     },
    //   },
    // },
    { title: '昵称', field: 'nickname', minWidth: 120 },
    { title: 'OpenID', field: 'openid', minWidth: 200, showOverflow: true },
    {
      title: '注册平台',
      field: 'platform',
      width: 110,
      slots: {
        default: ({ row }) => {
          const platformMap: Record<
            string,
            { name: string; color: string; icon: string }
          > = {
            weixin: { name: '微信', color: '#07c160', icon: '🟢' },
            xiaohongshu: { name: '小红书', color: '#ff2442', icon: '🔴' },
            douyin: { name: '抖音', color: '#000000', icon: '⚫' },
            alipay: { name: '支付宝', color: '#1677ff', icon: '🔵' },
          };
          const platform = platformMap[row.platform] || {
            name: row.platform,
            color: '#999',
            icon: '📱',
          };
          return h(
            'span',
            {
              style: { color: platform.color, fontWeight: 500 },
            },
            `${platform.icon} ${platform.name}`,
          );
        },
      },
    },
    {
      title: '用户等级',
      field: 'userLevel',
      width: 100,
      slots: {
        default: ({ row }) => {
          const color = getLevelColor(row.userLevel);
          return h(
            'span',
            {
              class: 'ant-tag ant-tag-' + color,
              style: { borderRadius: '2px' },
            },
            `LV${row.userLevel}`,
          );
        },
      },
    },
    {
      title: 'VIP状态',
      field: 'isVip',
      width: 200,
      slots: {
        default: ({ row }) => {
          if (row.isVip === 1) {
            const expireText = row.vipExpireTime
              ? ` (${formatDate(row.vipExpireTime)}到期)`
              : '';
            return h(
              'span',
              { class: 'ant-tag ant-tag-gold' },
              'VIP' + expireText,
            );
          }
          return h('span', { class: 'ant-tag' }, '普通');
        },
      },
    },
    {
      title: '下载次数',
      field: 'downloadCount',
      width: 120,
      slots: {
        default: ({ row }) => {
          return h('div', [
            h('div', `剩余: ${row.downloadCount}`),
            h(
              'div',
              { style: { fontSize: '12px', color: '#999' } },
              `已下载: ${row.totalDownloads}`,
            ),
          ]);
        },
      },
    },
    { title: '收藏数', field: 'totalCollections', width: 100 },
    { title: '备注', field: 'remark', minWidth: 150, showOverflow: true },
    {
      title: '状态',
      field: 'status',
      width: 100,
      cellRender: {
        name: canEdit ? 'CellSwitch' : 'CellTag',
        attrs: canEdit ? { beforeChange: onStatusChange } : undefined,
      },
    },
    {
      title: '注册时间',
      field: 'createdAt',
      width: 180,
      formatter: ({ cellValue }) => formatDate(cellValue),
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      slots: {
        default: ({ row }) => {
          // VIP下拉菜单
          const vipMenu = h(
            Menu,
            {},
            {
              default: () => [
                h(
                  MenuItem,
                  {
                    key: 'grant',
                    onClick: () => handleVipGrant(row),
                  },
                  { default: () => '新增VIP' },
                ),
                h(
                  MenuItem,
                  {
                    key: 'renew',
                    onClick: () => handleVipRenew(row),
                  },
                  { default: () => '续期VIP' },
                ),
                h(
                  MenuItem,
                  {
                    key: 'cancel',
                    onClick: () => handleVipCancel(row),
                    style: { color: '#ff4d4f' },
                  },
                  { default: () => '取消VIP' },
                ),
              ],
            },
          );

          if (!canEdit) {
            return h('span', { style: { color: '#999' } }, '-');
          }

          return h(
            'div',
            { style: { display: 'flex', gap: '8px', flexWrap: 'wrap' } },
            [
              h(
                'a',
                {
                  onClick: () => handleEditCount(row),
                  style: { color: '#1890ff' },
                },
                '调整次数',
              ),
              h(
                'a',
                {
                  onClick: () => handleEditRemark(row),
                  style: { color: '#1890ff' },
                },
                '备注',
              ),
              h(
                Dropdown,
                {
                  trigger: ['click'],
                },
                {
                  default: () =>
                    h(
                      'a',
                      {
                        style: { color: '#faad14', fontWeight: 500 },
                        onClick: (e: Event) => e.preventDefault(),
                      },
                      [
                        'VIP管理 ',
                        h('span', {
                          class: 'icon-[ant-design--down-outlined]',
                          style: { fontSize: '12px' },
                        }),
                      ],
                    ),
                  overlay: () => vipMenu,
                },
              ),
            ],
          );
        },
      },
    },
  ],
  height: 'auto',
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    response: {
      result: 'list',
      total: 'total',
    },
    ajax: {
      query: async ({ page }, formValues) => {
        return await getUserListApi({
          page: page.currentPage,
          pageSize: page.pageSize,
          id: formValues.id ? Number(formValues.id) : undefined,
          keyword: formValues.keyword || undefined,
          userLevel:
            formValues.userLevel !== undefined && formValues.userLevel !== ''
              ? Number(formValues.userLevel)
              : undefined,
          isVip:
            formValues.isVip !== undefined && formValues.isVip !== ''
              ? Number(formValues.isVip)
              : undefined,
        });
      },
    },
  },
  toolbarConfig: {
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 调整次数
const handleEditCount = (row: UserManageApi.UserInfo) => {
  prompt({
    title: `调整下载次数 - 用户ID: ${row.id}`,
    content: '请输入新的下载次数',
    component: InputNumber,
    componentProps: {
      min: 0,
      placeholder: '请输入下载次数',
      style: { width: '100%' },
    },
    defaultValue: row.downloadCount,
    modelPropName: 'value',
  }).then(async (val) => {
    if (val !== undefined && val !== null) {
      try {
        await updateUserDownloadCountApi(row.id, val);
        message.success('调整成功');
        gridApi.reload();
      } catch (error: any) {
        message.error(error.message || '调整失败');
      }
    }
  });
};

// 编辑备注
const handleEditRemark = (row: UserManageApi.UserInfo) => {
  prompt({
    title: `编辑备注 - 用户ID: ${row.id}`,
    content: '请输入备注信息',
    component: TextArea,
    componentProps: {
      placeholder: '请输入备注信息',
      rows: 4,
      maxlength: 500,
      showCount: true,
    },
    defaultValue: row.remark || '',
    modelPropName: 'value',
  }).then(async (val) => {
    if (val !== undefined && val !== null) {
      try {
        await updateUserRemarkApi(row.id, val || '');
        message.success('备注保存成功');
        gridApi.reload();
      } catch (error: any) {
        message.error(error.message || '保存失败');
      }
    }
  });
};

// 新增VIP
const handleVipGrant = (row: UserManageApi.UserInfo) => {
  vipGrantFormRef.value?.open(row);
};

// 续期VIP
const handleVipRenew = (row: UserManageApi.UserInfo) => {
  vipRenewFormRef.value?.open(row);
};

// 取消VIP
const handleVipCancel = (row: UserManageApi.UserInfo) => {
  const vipInfo = row.vipExpireTime
    ? `\n\n当前到期时间: ${formatDate(row.vipExpireTime)}`
    : '';

  confirm({
    title: '取消VIP',
    content: `确定要取消用户 ${row.id} 的VIP权限吗？${vipInfo}`,
    icon: 'warning',
    confirmText: '确定取消',
    cancelText: '取消',
  })
    .then(async () => {
      try {
        await cancelUserVipApi(row.id);
        message.success('已取消VIP');
        gridApi.reload();
      } catch (error: any) {
        message.error(error.message || '取消失败');
      }
    })
    .catch(() => {
      // 用户点击取消，不做任何操作
    });
};

// 刷新列表
const refreshGrid = () => {
  gridApi.reload();
};
</script>

<template>
  <Page auto-content-height>
    <Grid />
    <!-- VIP管理表单 -->
    <VipForm ref="vipGrantFormRef" action-type="grant" @success="refreshGrid" />
    <VipForm ref="vipRenewFormRef" action-type="renew" @success="refreshGrid" />
  </Page>
</template>
