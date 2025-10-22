<script lang="ts" setup>
import type { AdminUserApi } from '#/api/system/admin-user';

import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { message } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { createAdminUserApi, updateAdminUserApi } from '#/api/system/admin-user';
import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<AdminUserApi.AdminUserInfo>();

const isEdit = computed(() => !!formData.value?.id);

const getTitle = computed(() => {
  return isEdit.value ? '编辑管理员' : '新增管理员';
});

const [Form, formApi] = useVbenForm({
  layout: 'vertical',
  schema: useSchema(false),
  showDefaultActions: false,
});

function resetForm() {
  // 根据是否编辑模式更新 schema
  const schema = useSchema(isEdit.value);
  formApi.setState({ schema });
  formApi.resetForm();

  if (formData.value) {
    // 编辑模式:设置现有值
    formApi.setValues(formData.value);
  } else {
    // 新增模式:设置默认值
    formApi.setValues({
      role: 'editor',
    });
  }
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data: any = await formApi.getValues();

      try {
        if (isEdit.value) {
          await updateAdminUserApi(formData.value!.id, data);
          message.success('更新成功');
        } else {
          await createAdminUserApi(data);
          message.success('创建成功');
        }
        emit('success');
        modalApi.close();
      } catch (error: any) {
        message.error(error.message || '操作失败');
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

function open(data?: AdminUserApi.AdminUserInfo) {
  formData.value = data;
  modalApi.open();
}

defineExpose({ open });
</script>

<template>
  <Modal :title="getTitle" class="w-full max-w-2xl">
    <Form />
  </Modal>
</template>
