<script lang="ts" setup>
import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getInvitationListApi } from '#/api/manage/invitation';
import { getUserListApi, type UserManageApi } from '#/api/manage/user';
import UserInfoModal from '#/views/manage/user/modules/user-info.vue';

import { useColumns } from './data';

// UID 列点击弹出的用户信息弹窗
const userInfoRef = ref<InstanceType<typeof UserInfoModal>>();
function handleUidClick(uid: string) {
  userInfoRef.value?.open(uid);
}

// 邀请者 / 被邀请者：各一个远程搜索下拉（可按昵称或 UID 联想，选中回传完整 UID）
const inviterOptions = ref<{ label: string; value: string }[]>([]);
const inviteeOptions = ref<{ label: string; value: string }[]>([]);
let inviterTimer: any;
let inviteeTimer: any;

function makeSearch(
  target: typeof inviterOptions,
  getTimer: () => any,
  setTimer: (t: any) => void,
) {
  return (kw: string) => {
    clearTimeout(getTimer());
    const key = (kw || '').trim();
    if (!key) {
      target.value = [];
      return;
    }
    setTimer(
      setTimeout(async () => {
        try {
          // keyword 后端会同时匹配昵称/UID/openid/邀请码，输入哪个都能联想
          const res = await getUserListApi({ keyword: key, page: 1, pageSize: 20 });
          target.value = (res.list || []).map((u: UserManageApi.UserInfo) => ({
            label: `${u.nickname || '(无昵称)'} · ${u.uid}`,
            value: u.uid,
          }));
        } catch {
          target.value = [];
        }
      }, 300),
    );
  };
}

const handleInviterSearch = makeSearch(
  inviterOptions,
  () => inviterTimer,
  (t) => (inviterTimer = t),
);
const handleInviteeSearch = makeSearch(
  inviteeOptions,
  () => inviteeTimer,
  (t) => (inviteeTimer = t),
);

const formOptions: VbenFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'Select',
      fieldName: 'inviterUid',
      label: '邀请者',
      componentProps: () => ({
        allowClear: true,
        filterOption: false,
        notFoundContent: null,
        onSearch: handleInviterSearch,
        options: inviterOptions.value,
        placeholder: '输入昵称/UID 远程搜索',
        showSearch: true,
      }),
    },
    {
      component: 'Select',
      fieldName: 'inviteeUid',
      label: '被邀请者',
      componentProps: () => ({
        allowClear: true,
        filterOption: false,
        notFoundContent: null,
        onSearch: handleInviteeSearch,
        options: inviteeOptions.value,
        placeholder: '输入昵称/UID 远程搜索',
        showSearch: true,
      }),
    },
  ],
  wrapperClass: 'grid-cols-2 md:grid-cols-3 xl:grid-cols-5',
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: true,
};

const [Grid] = useVbenVxeGrid({
  formOptions,
  gridOptions: {
    columns: useColumns(handleUidClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      enabled: true,
    },
    stripe: true,
    proxyConfig: {
      response: {
        result: 'list',
        total: 'total',
      },
      ajax: {
        query: async ({ page }, formValues) => {
          return await getInvitationListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            inviterUid: formValues.inviterUid
              ? String(formValues.inviterUid).trim()
              : undefined,
            inviteeUid: formValues.inviteeUid
              ? String(formValues.inviteeUid).trim()
              : undefined,
          });
        },
      },
    },
    rowConfig: { isCurrent: true, isHover: true },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});
</script>

<template>
  <Page auto-content-height>
    <Grid table-title="邀请记录" />
    <UserInfoModal ref="userInfoRef" />
  </Page>
</template>
