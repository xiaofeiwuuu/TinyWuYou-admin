<script lang="ts" setup>
import type { CategoryManageApi } from '#/api/manage/category';

import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Button } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { createCategoryApi, updateCategoryApi } from '#/api/manage/category';
import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<CategoryManageApi.CategoryInfo>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑分类' : '新增分类';
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
  class: 'w-[600px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();

      // 如果内容类型是文案,清除 imageType 字段
      if (data.contentType === 'text') {
        delete data.imageType;
      }

      // 处理上传文件,提取 URL
      if (data.iconUrl && Array.isArray(data.iconUrl)) {
        const files = data.iconUrl;
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
        data.iconUrl = url;
      }

      try {
        await (formData.value?.id
          ? updateCategoryApi(formData.value.id, data as CategoryManageApi.SaveParams)
          : createCategoryApi(data as CategoryManageApi.SaveParams));
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<CategoryManageApi.CategoryInfo>();
      if (data) {
        formData.value = data;
        // 转换 iconUrl 为 Upload 组件期望的格式
        const formValues = { ...data };
        if (formValues.iconUrl && typeof formValues.iconUrl === 'string') {
          formValues.iconUrl = [
            {
              uid: '-1',
              name: formValues.iconUrl.split('/').pop() || 'icon',
              status: 'done',
              url: formValues.iconUrl,
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
