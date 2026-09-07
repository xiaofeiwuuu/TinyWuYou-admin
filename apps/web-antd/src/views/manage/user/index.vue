<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UserManageApi } from '#/api/manage/user';

import { h, ref } from 'vue';

import { useAccess } from '@vben/access';
import { Page, prompt } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Dropdown,
  Input,
  InputNumber,
  Menu,
  MenuItem,
  message,
  Modal,
  Tag,
} from 'ant-design-vue';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  cancelUserVipApi,
  getUserListApi,
  toggleUserStatusApi,
  adjustUserDownloadCountApi,
  updateUserRemarkApi,
} from '#/api/manage/user';
import { copyWithTip } from '#/utils/clipboard';

import UserInfoModal from './modules/user-info.vue';
import VipForm from './modules/vip-form.vue';

const { TextArea } = Input;

// 权限检查
const { hasAccessByCodes } = useAccess();
const canEdit = hasAccessByCodes(['user:edit']);

// VIP管理表单组件引用
const vipGrantFormRef = ref<InstanceType<typeof VipForm>>();
const vipRenewFormRef = ref<InstanceType<typeof VipForm>>();

// UID 点击弹出的用户详情弹窗
const userInfoRef = ref<InstanceType<typeof UserInfoModal>>();
function handleUidClick(uid: string) {
  if (uid) userInfoRef.value?.open(uid);
}

// 两个独立的远程搜索：UID 按 uid 联想、用户名按 nickname 联想（各查各的字段）
const uidOptions = ref<{ label: string; value: string }[]>([]);
const nameOptions = ref<{ label: string; value: string }[]>([]);
let uidTimer: any;
let nameTimer: any;

const handleUidSearch = (kw: string) => {
  clearTimeout(uidTimer);
  const key = (kw || '').trim();
  if (!key) {
    uidOptions.value = [];
    return;
  }
  uidTimer = setTimeout(async () => {
    try {
      const res = await getUserListApi({ uid: key, page: 1, pageSize: 20 });
      uidOptions.value = (res.list || []).map((u: UserManageApi.UserInfo) => ({
        label: `${u.uid} · ${u.nickname || '(无昵称)'}`,
        value: u.uid,
      }));
    } catch {
      uidOptions.value = [];
    }
  }, 300);
};

const handleNameSearch = (kw: string) => {
  clearTimeout(nameTimer);
  const key = (kw || '').trim();
  if (!key) {
    nameOptions.value = [];
    return;
  }
  nameTimer = setTimeout(async () => {
    try {
      const res = await getUserListApi({ nickname: key, page: 1, pageSize: 20 });
      nameOptions.value = (res.list || []).map((u: UserManageApi.UserInfo) => ({
        label: `${u.nickname || '(无昵称)'} · ${u.uid}`,
        value: u.nickname || '',
      }));
    } catch {
      nameOptions.value = [];
    }
  }, 300);
};

const formOptions: VbenFormProps = {
  collapsed: false,
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  schema: [
    {
      component: 'Select',
      fieldName: 'uid',
      label: 'UID',
      // 函数式 componentProps 是响应式的，uidOptions 变化会自动刷新下拉项
      componentProps: () => ({
        allowClear: true,
        filterOption: false, // 远程搜索，不做本地过滤
        notFoundContent: null,
        onSearch: handleUidSearch,
        options: uidOptions.value,
        placeholder: '输入 UID 远程搜索',
        showSearch: true,
      }),
    },
    {
      component: 'Select',
      fieldName: 'nickname',
      label: '用户名',
      // 独立的用户名远程搜索，按 nickname 联想
      componentProps: () => ({
        allowClear: true,
        filterOption: false,
        notFoundContent: null,
        onSearch: handleNameSearch,
        options: nameOptions.value,
        placeholder: '输入用户名远程搜索',
        showSearch: true,
      }),
    },
    {
      component: 'Select',
      fieldName: 'isVip',
      label: 'VIP状态',
      componentProps: {
        allowClear: true,
        dropdownMatchSelectWidth: false,
        placeholder: '全部',
        options: [
          { label: '非VIP', value: 0 },
          { label: 'VIP用户', value: 1 },
        ],
      },
    },
    {
      component: 'Select',
      fieldName: 'status',
      label: '用户状态',
      componentProps: {
        allowClear: true,
        dropdownMatchSelectWidth: false,
        placeholder: '全部',
        options: [
          { label: '正常', value: 1 },
          { label: '已禁用', value: 0 },
        ],
      },
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const formatDate = (date: string) => {
  if (!date) return '-';
  return formatDateTime(date);
};

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

/**
 * 状态开关即将改变
 * @param newStatus 期望改变的状态值
 * @param row 行数据
 * @returns 返回false则中止改变，返回其他值（undefined、true）则允许改变
 */
async function onStatusChange(newStatus: number, row: UserManageApi.UserInfo) {
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
    // 用户取消操作,不显示错误
    return false;
  }
}

const gridOptions: VxeTableGridOptions<UserManageApi.UserInfo> = {
  columns: [
    {
      title: 'UID',
      field: 'uid',
      width: 110,
      slots: {
        // 点击 UID 弹出用户详情（弹窗内 UID 可复制）
        default: ({ row }) =>
          row.uid
            ? h(
                'span',
                {
                  class: 'cursor-pointer font-mono text-blue-600 hover:underline',
                  title: '点击查看用户详情',
                  onClick: () => handleUidClick(row.uid),
                },
                row.uid,
              )
            : h('span', { class: 'text-muted-foreground' }, '-'),
      },
    },
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
      title: '邀请码',
      field: 'inviteCode',
      width: 100,
      slots: {
        default: ({ row }) =>
          h(
            'span',
            {
              class: 'cursor-pointer select-all font-mono hover:underline',
              title: '点击复制邀请码',
              onClick: () =>
                copyWithTip(row.inviteCode, `已复制 ${row.inviteCode}`),
            },
            row.inviteCode ?? '-',
          ),
      },
    },
    {
      title: 'VIP状态',
      field: 'isVip',
      width: 100,
      slots: {
        default: ({ row }) =>
          row.isVip === 1
            ? h(Tag, { color: 'gold' }, { default: () => 'VIP' })
            : h(Tag, {}, { default: () => '普通' }),
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
        attrs: { beforeChange: canEdit ? onStatusChange : undefined },
      },
    },
    {
      title: '最后登录',
      field: 'lastLoginTime',
      width: 180,
      // 老用户这一列会是空的：登录时间是这次才开始记的，
      // 之前的登录没有留下记录，显示成"—"而不是空白，免得看着像加载失败
      formatter: ({ cellValue }) => (cellValue ? formatDate(cellValue) : '—'),
    },
    {
      title: '登录IP',
      field: 'lastLoginIp',
      width: 140,
      showOverflow: true,
      formatter: ({ cellValue }) => cellValue || '—',
    },
    {
      title: '操作',
      width: 200,
      fixed: 'right',
      align: 'center',
      slots: {
        default: ({ row }) => {
          // 判断口径与「VIP状态」列一致（row.isVip === 1）
          const isVip = row.isVip === 1;

          if (!canEdit) {
            return h('span', { style: { color: '#999' } }, '-');
          }

          // VIP → 「VIP管理」下拉（续期/取消）；非VIP → 直接一个「开通VIP」链接
          const vipAction = isVip
            ? h(
                Dropdown,
                { trigger: ['click'] },
                {
                  default: () =>
                    h(
                      'a',
                      {
                        style: { color: '#faad14', fontWeight: 500 },
                        onClick: (e: Event) => e.preventDefault(),
                      },
                      [
                        '管理VIP ',
                      ],
                    ),
                  overlay: () =>
                    h(
                      Menu,
                      {},
                      {
                        default: () => [
                          h(
                            MenuItem,
                            { key: 'renew', onClick: () => handleVipRenew(row) },
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
                    ),
                },
              )
            : h(
                'a',
                {
                  onClick: () => handleVipGrant(row),
                  style: { color: '#faad14', fontWeight: 500 },
                },
                '开通VIP',
              );

          return h(
            'div',
            {
              style: {
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
              },
            },
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
              vipAction,
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
          uid: formValues.uid ? String(formValues.uid).trim() : undefined,
          nickname: formValues.nickname
            ? String(formValues.nickname).trim()
            : undefined,
          isVip:
            formValues.isVip !== undefined && formValues.isVip !== ''
              ? Number(formValues.isVip)
              : undefined,
          status:
            formValues.status !== undefined && formValues.status !== ''
              ? Number(formValues.status)
              : undefined,
        });
      },
    },
  },
  rowConfig: { isCurrent: true, isHover: true },
  toolbarConfig: {
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useVbenVxeGrid({
  formOptions,
  gridOptions,
});

// 调整次数：输入增减量（正数增加、负数扣减），而不是覆盖绝对值
const handleEditCount = (row: UserManageApi.UserInfo) => {
  prompt<number>({
    title: `调整下载次数 - ${row.nickname || row.uid}`,
    content: `当前剩余 ${row.downloadCount} 次。输入增减量：正数增加、负数扣减（最多可扣 ${row.downloadCount}）。`,
    component: InputNumber,
    componentProps: {
      // 不允许扣到负数：下限就是把当前次数全部扣光
      min: -(row.downloadCount || 0),
      placeholder: '如 10 表示增加 10，-5 表示扣减 5',
      style: { width: '100%' },
    },
    defaultValue: 0,
    modelPropName: 'value',
  }).then(async (delta) => {
    if (delta === undefined || delta === null || delta === 0) {
      return;
    }
    try {
      const { downloadCount } = await adjustUserDownloadCountApi(row.id, delta);
      message.success(
        `${delta > 0 ? '增加' : '扣减'} ${Math.abs(delta)} 次，当前剩余 ${downloadCount} 次`,
      );
      gridApi.reload();
    } catch (error: any) {
      message.error(error.message || '调整失败');
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
    <UserInfoModal ref="userInfoRef" />
  </Page>
</template>
