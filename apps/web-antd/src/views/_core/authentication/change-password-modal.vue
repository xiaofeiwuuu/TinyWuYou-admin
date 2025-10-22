<script lang="ts" setup>
import { ref } from 'vue';
import { useVbenModal, useVbenForm } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { changePasswordApi } from '#/api/core/auth';
import { z } from '#/adapter/form';

const [Modal, modalApi] = useVbenModal({
  onConfirm: handleConfirm,
});

const [Form, formApi] = useVbenForm({
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'InputPassword',
      fieldName: 'oldPassword',
      label: '原密码',
      rules: z.string().min(1, { message: '请输入原密码' }),
    },
    {
      component: 'InputPassword',
      fieldName: 'newPassword',
      label: '新密码',
      rules: z.string().min(6, { message: '新密码至少6位' }),
    },
    {
      component: 'InputPassword',
      fieldName: 'confirmPassword',
      label: '确认新密码',
      rules: z.string().min(1, { message: '请确认新密码' }),
    },
  ],
  showDefaultActions: false,
});

const loading = ref(false);

async function handleConfirm() {
  loading.value = true;
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      loading.value = false;
      return;
    }

    const values = await formApi.getValues();
    console.log('表单值:', values);

    // 检查两次密码是否一致
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的新密码不一致');
      loading.value = false;
      return;
    }

    // 调用修改密码接口
    await changePasswordApi({
      oldPassword: values.oldPassword,
      newPassword: values.newPassword,
    });

    message.success('密码修改成功');
    formApi.resetForm();
    modalApi.close();
  } catch (error: any) {
    console.error('修改密码错误:', error);
    message.error(error.message || '密码修改失败');
  } finally {
    loading.value = false;
  }
}

function open() {
  formApi.resetForm();
  modalApi.open();
}

defineExpose({
  open,
});
</script>

<template>
  <Modal title="修改密码" :loading="loading" class="w-[500px]">
    <Form />
  </Modal>
</template>
