<script lang="ts" setup>
import type { AdminUserApi } from '#/api/system/admin-user';

import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { useVbenForm, z } from '#/adapter/form';
import { resetAdminPasswordApi } from '#/api/system/admin-user';

const emit = defineEmits(['success']);
const userData = ref<AdminUserApi.AdminUserInfo>();

const getTitle = computed(() => {
  return userData.value ? `修改密码 - ${userData.value.username}` : '修改密码';
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: [
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: '请输入新密码',
        autocomplete: 'new-password',
      },
      fieldName: 'password',
      label: '新密码',
      rules: z
        .string()
        .min(6, '密码至少6个字符')
        .max(50, '密码不能超过50个字符'),
    },
    {
      component: 'InputPassword',
      componentProps: {
        placeholder: '请再次输入新密码',
        autocomplete: 'new-password',
      },
      fieldName: 'confirmPassword',
      label: '确认密码',
      rules: z
        .string()
        .min(6, '密码至少6个字符')
        .max(50, '密码不能超过50个字符'),
    },
  ],
  showDefaultActions: false,
});

function resetForm() {
  formApi.resetForm();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      const data = await formApi.getValues();

      // 验证两次密码是否一致
      if (data.password !== data.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }

      if (!userData.value) {
        message.error('用户信息不存在');
        return;
      }

      modalApi.lock();
      try {
        await resetAdminPasswordApi(userData.value.id, data.password);
        message.success('密码修改成功');
        emit('success');
        modalApi.close();
      } catch (error: any) {
        message.error(error.message || '密码修改失败');
      } finally {
        modalApi.unlock();
      }
    }
  },
  onOpenChange(isOpen: boolean) {
    if (isOpen) {
      resetForm();
    }
  },
});

function open(data: AdminUserApi.AdminUserInfo) {
  userData.value = data;
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal :title="getTitle" class="w-full max-w-xl">
    <Form />
  </Modal>
</template>
