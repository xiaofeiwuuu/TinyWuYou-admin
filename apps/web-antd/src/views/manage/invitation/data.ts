import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';
import type { InvitationManageApi } from '#/api/manage/invitation';

export function useColumns(): VxeTableGridOptions<InvitationManageApi.InvitationInfo>['columns'] {
  return [
    { title: '序号', type: 'seq', width: 50 },
    {
      title: '邀请人ID',
      field: 'inviterId',
      width: 100,
    },
    {
      title: '邀请人昵称',
      field: 'inviterNickname',
      minWidth: 150,
    },
    {
      title: '被邀请人ID',
      field: 'inviteeId',
      width: 100,
    },
    {
      title: '被邀请人昵称',
      field: 'inviteeNickname',
      minWidth: 150,
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
      formatter: ({ cellValue }) => {
        if (!cellValue) return '-';
        return new Date(cellValue).toLocaleString('zh-CN');
      },
    },
  ];
}
