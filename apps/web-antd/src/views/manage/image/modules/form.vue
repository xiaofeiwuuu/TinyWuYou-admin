<script lang="ts" setup>
import type { ImageManageApi } from '#/api/manage/image';

import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Button } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { createImageApi, updateImageApi } from '#/api/manage/image';
import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ImageManageApi.ImageInfo>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑图片' : '新增图片';
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useSchema(),
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
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

      // 处理图片上传,提取 URL 和元数据
      if (data.imageUrl && Array.isArray(data.imageUrl)) {
        const files = data.imageUrl;
        const doneFile = files.find((file: any) => file.status === 'done');

        // response 已经是数据对象(被拦截器提取过),不需要 .data
        let url = doneFile?.response?.url || doneFile?.url || '';
        let thumbnailUrl = doneFile?.response?.thumbnailUrl || '';

        // 确保只保存相对路径到数据库（去除域名部分）
        if (url && url.includes('://')) {
          try {
            url = new URL(url).pathname;
          } catch (e) {
            console.warn('解析URL失败，使用原始值:', url);
          }
        }
        data.imageUrl = url;

        // 处理缩略图URL
        if (thumbnailUrl && thumbnailUrl.includes('://')) {
          try {
            thumbnailUrl = new URL(thumbnailUrl).pathname;
          } catch (e) {
            console.warn('解析缩略图URL失败，使用原始值:', thumbnailUrl);
          }
        }
        data.thumbnailUrl = thumbnailUrl || null;

        // 自动填充图片宽高和文件大小
        if (doneFile?.response) {
          const metadata = doneFile.response;
          data.width = metadata.width;
          data.height = metadata.height;
          data.aspectRatio = metadata.aspectRatio;
          data.fileSize = metadata.size;
        }
      }

      try {
        await (formData.value?.id
          ? updateImageApi(formData.value.id, data as ImageManageApi.SaveParams)
          : createImageApi(data as ImageManageApi.SaveParams));
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<ImageManageApi.ImageInfo>();
      if (data) {
        formData.value = data;
        // 转换图片 URL 为 Upload 组件期望的格式
        const formValues = { ...data };

        if (formValues.imageUrl && typeof formValues.imageUrl === 'string') {
          formValues.imageUrl = [
            {
              uid: '-1',
              name: formValues.imageUrl.split('/').pop() || 'image',
              status: 'done',
              url: formValues.imageUrl,
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
