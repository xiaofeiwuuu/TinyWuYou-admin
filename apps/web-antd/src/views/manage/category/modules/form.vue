<script lang="ts" setup>
import type { CategoryManageApi } from '#/api/manage/category';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createCategoryApi, updateCategoryApi } from '#/api/manage/category';
import { loadImageTypes } from '#/constants/image-type';

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

// 新增态的默认类型已经写进 schema，resetForm 就会带上，这里不用再单独设
async function resetForm() {
  await formApi.resetForm();
  if (formData.value) {
    formApi.setValues(formData.value);
  }
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
          } catch {
            console.warn('解析URL失败，使用原始值:', url);
          }
        }
        data.iconUrl = url;
      }

      try {
        await (formData.value?.id
          ? updateCategoryApi(
              formData.value.id,
              data as CategoryManageApi.SaveParams,
            )
          : createCategoryApi(data as CategoryManageApi.SaveParams));
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<CategoryManageApi.CategoryInfo>();
      if (data) {
        formData.value = data;
        // 转换 iconUrl 为 Upload 组件期望的格式
        const formValues = { ...data };
        // Upload 的 fileList 只接受数组。库里有 43 个分类的 icon_url 是空的，
        // 空字符串原样传给 Upload 会抛 .map is not a function，所以要兜底成 []
        formValues.iconUrl =
          formValues.iconUrl && typeof formValues.iconUrl === 'string'
            ? [
                {
                  uid: '-1',
                  name: formValues.iconUrl.split('/').pop() || 'icon',
                  status: 'done',
                  url: formValues.iconUrl,
                },
              ]
            : Array.isArray(formValues.iconUrl)
              ? formValues.iconUrl
              : [];
        formApi.setValues(formValues);
        // 不 await：选项是响应式的，加载完会自动填进下拉框，
        // 放在 setValues 之前 await 会让表单先渲染一帧空值
        loadImageTypes();
      } else {
        formData.value = undefined;
        // 默认类型由 schema 的 defaultValue 提供，这里只需保证配置是新的
        loadImageTypes();
        await formApi.resetForm();
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

<style scoped>
/* 当已上传文件达到 maxCount 限制时，隐藏上传按钮 */
:deep(.ant-upload-wrapper.ant-upload-picture-card-wrapper)
  .ant-upload-list-item-container
  ~ .ant-upload {
  display: none;
}
</style>
