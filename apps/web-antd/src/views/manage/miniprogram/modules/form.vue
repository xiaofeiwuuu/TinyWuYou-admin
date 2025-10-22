<script lang="ts" setup>
import type { MiniProgramManageApi } from '#/api/manage/miniprogram';

import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Button } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { createMiniProgramApi, updateMiniProgramApi } from '#/api/manage/miniprogram';
import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<MiniProgramManageApi.MiniProgramInfo>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑小程序' : '新增小程序';
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useSchema(),
  showDefaultActions: false,
});

function resetForm() {
  formApi.resetForm();
  formApi.setValues(formData.value || {});
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();

      // 处理上传文件,提取 URL
      if (data.coverUrl && Array.isArray(data.coverUrl)) {
        const files = data.coverUrl;
        const doneFile = files.find((file: any) => file.status === 'done');
        let url = doneFile?.response?.url || doneFile?.url || null;

        // 确保只保存相对路径到数据库（去除域名部分）
        if (url && url.includes('://')) {
          try {
            url = new URL(url).pathname;
          } catch (e) {
            console.warn('解析URL失败，使用原始值:', url);
          }
        }
        data.coverUrl = url;
      }

      try {
        await (formData.value?.id
          ? updateMiniProgramApi(formData.value.id, data as MiniProgramManageApi.SaveParams)
          : createMiniProgramApi(data as MiniProgramManageApi.SaveParams));
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<MiniProgramManageApi.MiniProgramInfo>();
      if (data) {
        formData.value = data;
        // 转换 coverUrl 为 Upload 组件期望的格式
        const formValues = { ...data };
        if (formValues.coverUrl && typeof formValues.coverUrl === 'string') {
          formValues.coverUrl = [
            {
              uid: '-1',
              name: formValues.coverUrl.split('/').pop() || 'cover',
              status: 'done',
              url: formValues.coverUrl,
            },
          ];
        }
        formApi.setValues(formValues);
      } else {
        formData.value = undefined;
        formApi.resetForm();
      }
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <Button type="primary" danger @click="resetForm"> 重置 </Button>
      </div>
    </template>
  </Modal>
</template>
