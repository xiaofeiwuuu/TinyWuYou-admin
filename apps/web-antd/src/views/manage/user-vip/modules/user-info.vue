<script lang="ts" setup>
import type { UserManageApi } from '#/api/manage/user';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import {
  Avatar as AAvatar,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Empty as AEmpty,
  Tag as ATag,
} from 'ant-design-vue';

import { getUserListApi } from '#/api/manage/user';
import { copyWithTip } from '#/utils/clipboard';

const [Modal, modalApi] = useVbenModal();

const loading = ref(false);
const user = ref<null | UserManageApi.UserInfo>(null);

const levelText = computed(() => {
  const map: Record<number, string> = {
    1: 'LV1',
    2: 'LV2',
    3: 'LV3',
    4: 'LV4',
  };
  return user.value ? map[user.value.userLevel] || `LV${user.value.userLevel}` : '-';
});

const vipValid = computed(() => {
  if (!user.value || user.value.isVip !== 1) return false;
  return (
    !!user.value.vipExpireTime &&
    new Date(user.value.vipExpireTime).getTime() > Date.now()
  );
});

function fmt(value: null | string) {
  return value ? formatDateTime(value) : '-';
}

function copyUid() {
  if (user.value?.uid) {
    copyWithTip(user.value.uid, `已复制 ${user.value.uid}`);
  }
}

// 根据 uid 拉取完整用户信息后打开弹窗
async function open(uid: string) {
  if (!uid) return;
  user.value = null;
  loading.value = true;
  modalApi.open();
  try {
    const res = await getUserListApi({ uid, page: 1, pageSize: 1 });
    // uid 是精确的，正常只有一条；LIKE 命中多条时取完全相等那条兜底
    user.value =
      (res.list || []).find((u) => u.uid === uid) || res.list?.[0] || null;
  } catch {
    user.value = null;
  } finally {
    loading.value = false;
  }
}

defineExpose({ open });
</script>

<template>
  <Modal title="用户信息" :loading="loading" :footer="false" class="w-[560px]">
    <div v-if="user" class="py-1">
      <!-- 头部：头像 + 昵称 -->
      <div class="mb-4 flex items-center gap-3">
        <AAvatar :size="52" :src="user.avatarUrl || undefined">
          {{ (user.nickname || 'U').slice(0, 1) }}
        </AAvatar>
        <div class="min-w-0">
          <div class="truncate text-base font-medium">
            {{ user.nickname || '(未设置昵称)' }}
          </div>
          <div class="mt-1 flex items-center gap-2">
            <span
              class="cursor-pointer select-all font-mono text-sm text-blue-600 hover:underline"
              title="点击复制 UID"
              @click="copyUid"
            >
              UID: {{ user.uid }}
            </span>
            <span
              class="icon-[ant-design--copy-outlined] cursor-pointer text-blue-600"
              title="复制 UID"
              @click="copyUid"
            ></span>
          </div>
        </div>
      </div>

      <ADescriptions :column="2" bordered size="small">
        <ADescriptionsItem label="内部ID">{{ user.id }}</ADescriptionsItem>
        <ADescriptionsItem label="邀请码">
          {{ user.inviteCode || '-' }}
        </ADescriptionsItem>
        <ADescriptionsItem label="账号状态">
          <ATag :color="user.status === 1 ? 'green' : 'red'">
            {{ user.status === 1 ? '正常' : '已禁用' }}
          </ATag>
        </ADescriptionsItem>
        <ADescriptionsItem label="用户等级">{{ levelText }}</ADescriptionsItem>
        <ADescriptionsItem label="会员状态">
          <ATag :color="vipValid ? 'gold' : 'default'">
            {{ vipValid ? 'VIP' : '非VIP' }}
          </ATag>
        </ADescriptionsItem>
        <ADescriptionsItem label="VIP到期">
          {{ vipValid ? fmt(user.vipExpireTime) : '-' }}
        </ADescriptionsItem>
        <ADescriptionsItem label="剩余下载">
          {{ user.downloadCount }}
        </ADescriptionsItem>
        <ADescriptionsItem label="累计下载">
          {{ user.totalDownloads }}
        </ADescriptionsItem>
        <ADescriptionsItem label="累计收藏">
          {{ user.totalCollections }}
        </ADescriptionsItem>
        <ADescriptionsItem label="平台">
          {{ user.platform || '-' }}
        </ADescriptionsItem>
        <ADescriptionsItem label="注册时间">
          {{ fmt(user.createdAt) }}
        </ADescriptionsItem>
        <ADescriptionsItem label="最后登录">
          {{ fmt(user.lastLoginTime) }}
        </ADescriptionsItem>
        <ADescriptionsItem label="注册IP">
          {{ user.registerIp || '-' }}
        </ADescriptionsItem>
        <ADescriptionsItem label="最后登录IP">
          {{ user.lastLoginIp || '-' }}
        </ADescriptionsItem>
        <ADescriptionsItem label="备注" :span="2">
          {{ user.remark || '-' }}
        </ADescriptionsItem>
      </ADescriptions>
    </div>

    <AEmpty v-else-if="!loading" description="未找到该用户信息" />
  </Modal>
</template>
