import type { VxeTableGridOptions } from '@vben/plugins/vxe-table';

import type { UserVipApi } from '#/api/manage/user-vip';

import { h } from 'vue';

import { copyWithTip } from '#/utils/clipboard';

/** 开通方式的展示配置 */
export function getSourceTypeOptions() {
  return [
    { color: 'blue', label: '卡密兑换', value: 'card' },
    { color: 'green', label: '用户购买', value: 'purchase' },
    { color: 'orange', label: '后台赠送', value: 'admin' },
  ];
}

function formatTime(value: null | string) {
  return value ? new Date(value).toLocaleString('zh-CN') : '-';
}

export function useColumns(): VxeTableGridOptions<UserVipApi.UserVipRecord>['columns'] {
  return [
    {
      title: '用户',
      field: 'nickname',
      minWidth: 130,
      formatter: ({ cellValue }) => cellValue || '(未设置昵称)',
    },
    {
      // 独立成列，与用户列表保持一致——放在昵称下面当小字容易被忽略
      title: 'UID',
      field: 'uid',
      width: 110,
      slots: {
        default: ({ row }) =>
          h(
            'span',
            {
              class: 'cursor-pointer select-all font-mono hover:underline',
              title: '点击复制 UID',
              onClick: () => row.uid && copyWithTip(row.uid, `已复制 ${row.uid}`),
            },
            row.uid ?? '-',
          ),
      },
    },
    {
      title: '开通方式',
      field: 'sourceType',
      minWidth: 110,
      cellRender: {
        name: 'CellTag',
        options: getSourceTypeOptions(),
      },
    },
    {
      title: '卡号',
      field: 'cardCode',
      minWidth: 200,
      slots: {
        default: ({ row }) => {
          // 只有卡密兑换才有卡号，后台赠送/购买没有
          if (!row.cardCode) {
            return h('span', { class: 'text-muted-foreground' }, '-');
          }
          return h(
            'span',
            {
              class: 'cursor-pointer select-all font-mono hover:underline',
              title: '点击复制卡号',
              onClick: () => copyWithTip(row.cardCode!, `已复制 ${row.cardCode}`),
            },
            row.cardCode,
          );
        },
      },
    },
    {
      title: '批次号',
      field: 'batchNo',
      minWidth: 170,
      showOverflow: true,
      formatter: ({ cellValue }) => cellValue || '-',
    },
    {
      title: 'VIP天数',
      field: 'cardDays',
      minWidth: 90,
      formatter: ({ cellValue }) => (cellValue ? `${cellValue}天` : '-'),
    },
    {
      title: '赠送下载',
      field: 'cardDownloadCount',
      minWidth: 90,
      formatter: ({ cellValue }) => (cellValue ?? '-'),
    },
    {
      title: '卡密价格',
      field: 'cardPrice',
      minWidth: 90,
      formatter: ({ cellValue }) =>
        cellValue === null || cellValue === undefined ? '-' : `¥${cellValue}`,
    },
    {
      title: '兑换时间',
      field: 'activatedAt',
      minWidth: 180,
      formatter: ({ cellValue }) => formatTime(cellValue),
    },
    {
      title: 'VIP生效',
      field: 'startTime',
      minWidth: 180,
      formatter: ({ cellValue }) => formatTime(cellValue),
    },
    {
      title: 'VIP到期',
      field: 'expireTime',
      minWidth: 180,
      slots: {
        default: ({ row }) => {
          const expired = new Date(row.expireTime).getTime() < Date.now();
          return h(
            'span',
            { class: expired ? 'text-muted-foreground' : '' },
            `${formatTime(row.expireTime)}${expired ? '（已过期）' : ''}`,
          );
        },
      },
    },
  ];
}
