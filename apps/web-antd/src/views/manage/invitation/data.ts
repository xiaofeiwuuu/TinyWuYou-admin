import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { InvitationManageApi } from '#/api/manage/invitation';

import { h } from 'vue';

import { formatDateTime } from '@vben/utils';

/** 渲染一个可点击查看用户信息的 UID 单元格 */
function uidCell(uid: null | string, onUidClick?: (uid: string) => void) {
  if (!uid) {
    return h('span', { class: 'text-muted-foreground' }, '-');
  }
  return h(
    'span',
    {
      class: 'cursor-pointer font-mono text-blue-600 hover:underline',
      title: '点击查看用户信息',
      onClick: () => onUidClick?.(uid),
    },
    uid,
  );
}

export function useColumns(
  onUidClick?: (uid: string) => void,
): VxeTableGridOptions<InvitationManageApi.InvitationInfo>['columns'] {
  return [
    { title: '序号', type: 'seq', width: 50 },
    {
      title: '邀请人UID',
      field: 'inviterUid',
      width: 120,
      slots: {
        default: ({ row }) => uidCell(row.inviterUid, onUidClick),
      },
    },
    {
      title: '邀请人昵称',
      field: 'inviterNickname',
      minWidth: 150,
      formatter: ({ cellValue }) => cellValue || '(未设置昵称)',
    },
    {
      title: '被邀请人UID',
      field: 'inviteeUid',
      width: 120,
      slots: {
        default: ({ row }) => uidCell(row.inviteeUid, onUidClick),
      },
    },
    {
      title: '被邀请人昵称',
      field: 'inviteeNickname',
      minWidth: 150,
      formatter: ({ cellValue }) => cellValue || '(未设置昵称)',
    },
    {
      title: '奖励次数',
      field: 'rewardCount',
      width: 100,
    },
    {
      title: '邀请时间',
      field: 'createdAt',
      width: 180,
      formatter: ({ cellValue }) => (cellValue ? formatDateTime(cellValue) : '-'),
    },
  ];
}
