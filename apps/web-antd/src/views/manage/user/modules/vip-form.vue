<script lang="ts" setup>
import { ref, computed } from 'vue';
import { Button as AButton, InputNumber as AInputNumber, message } from 'ant-design-vue';
import { useVbenModal } from '@vben/common-ui';
import { grantUserVipApi, type UserManageApi } from '#/api/manage/user';

interface Props {
  actionType: 'grant' | 'renew';
}

interface Emits {
  (e: 'success'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const [Modal, modalApi] = useVbenModal({
  onConfirm: handleConfirm,
});

const userData = ref<UserManageApi.UserInfo | null>(null);
const customDays = ref(30);
const loading = ref(false);

const modalTitle = computed(() => {
  if (!userData.value) return 'VIP管理';
  const actionText = props.actionType === 'renew' ? '续期' : '新增';
  return `${actionText}VIP - 用户ID: ${userData.value.id}`;
});

const showCurrentVip = computed(() => {
  if (!userData.value) return false;
  return userData.value.isVip === 1 && userData.value.vipExpireTime &&
         new Date(userData.value.vipExpireTime) > new Date();
});

const currentVipInfo = computed(() => {
  if (!userData.value?.vipExpireTime) return '';
  return new Date(userData.value.vipExpireTime).toLocaleString('zh-CN');
});

// 快捷选择VIP时长（填充到输入框）
function handleQuickSelect(days: number) {
  customDays.value = days;
}

// 自定义天数确认
async function handleConfirm() {
  if (!userData.value) return;

  // 新增/续期VIP
  if (!customDays.value || customDays.value < 1) {
    message.warning('请输入有效的天数');
    return;
  }

  loading.value = true;
  try {
    await grantUserVipApi(userData.value.id, customDays.value);
    const actionText = props.actionType === 'renew' ? '续期' : '新增';
    message.success(`VIP${actionText}成功 (${customDays.value}天)`);
    emit('success');
    modalApi.close();
  } catch (error: any) {
    message.error(error.message || '操作失败');
  } finally {
    loading.value = false;
  }
}

// 设置用户数据并打开弹窗
function open(user: UserManageApi.UserInfo) {
  userData.value = user;
  customDays.value = 30;
  modalApi.open();
}

defineExpose({
  open,
});
</script>

<template>
  <Modal :title="modalTitle" :loading="loading" class="w-[500px]">
    <div class="py-2">
      <!-- 当前VIP信息 -->
      <div v-if="showCurrentVip" class="mb-4 rounded bg-blue-50 p-3 text-sm">
        <div class="text-gray-600">
          <span class="icon-[ant-design--info-circle-outlined] mr-1"></span>
          当前VIP到期时间: <span class="font-semibold text-blue-600">{{ currentVipInfo }}</span>
        </div>
      </div>

      <!-- 自定义天数 -->
      <div class="mb-4">
        <div class="mb-2 text-sm font-medium text-gray-700">自定义天数:</div>
        <div class="flex gap-2">
          <a-input-number
            v-model:value="customDays"
            :min="1"
            :max="3650"
            placeholder="请输入天数"
            class="flex-1"
          />
          <a-button type="primary" @click="handleConfirm" :loading="loading">
            确定
          </a-button>
        </div>
      </div>

      <!-- 快捷选择 -->
      <div>
        <div class="mb-2 text-sm font-medium text-gray-700">快捷选择:</div>
        <div class="grid grid-cols-3 gap-2">
          <a-button
            @click="handleQuickSelect(3)"
            :type="customDays === 3 ? 'primary' : 'default'"
          >3天</a-button>
          <a-button
            @click="handleQuickSelect(7)"
            :type="customDays === 7 ? 'primary' : 'default'"
          >7天</a-button>
          <a-button
            @click="handleQuickSelect(10)"
            :type="customDays === 10 ? 'primary' : 'default'"
          >10天</a-button>
          <a-button
            @click="handleQuickSelect(15)"
            :type="customDays === 15 ? 'primary' : 'default'"
          >15天</a-button>
          <a-button
            @click="handleQuickSelect(30)"
            :type="customDays === 30 ? 'primary' : 'default'"
          >30天</a-button>
          <a-button
            @click="handleQuickSelect(90)"
            :type="customDays === 90 ? 'primary' : 'default'"
          >90天</a-button>
        </div>
      </div>
    </div>
  </Modal>
</template>
