<script lang="ts" setup>
import type { CategoryManageApi } from '#/api/manage/category';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Image as AImage, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { deleteUploadedFile } from '#/api/core/upload';
import { createCategoryApi, updateCategoryApi } from '#/api/manage/category';
import { loadImageTypes } from '#/constants/image-type';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<CategoryManageApi.CategoryInfo>();
// 是否已成功提交：决定关闭弹窗时要不要清理"传了图但没保存"的孤儿文件
let submitted = false;

/** 清理本次新上传、最终没保存进库的图，避免 OBS 留下无人引用的孤儿文件 */
async function cleanupOrphanUpload(fileList: unknown) {
  if (!Array.isArray(fileList)) {
    return;
  }
  for (const f of fileList) {
    let url = f?.response?.url || f?.url;
    if (!url) {
      continue;
    }
    if (url.includes('://')) {
      try {
        url = new URL(url).pathname;
      } catch {
        // 保持原值
      }
    }
    try {
      await deleteUploadedFile(url);
    } catch {
      // 清理失败不影响关闭
    }
  }
}

const getTitle = computed(() => {
  return formData.value?.id ? '编辑分类' : '新增分类';
});

// 图标预览：点已上传的图弹层放大，而不是 antd 默认的打开新标签页
const previewSrc = ref('');
const previewOpen = ref(false);
function onPreview(file: any) {
  previewSrc.value = file?.url || file?.response?.url || '';
  previewOpen.value = Boolean(previewSrc.value);
}

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useSchema(onPreview),
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
  // 点遮罩 / 按 ESC 不关弹窗，避免误触把填了一半的表单关掉
  closeOnClickModal: false,
  closeOnPressEscape: false,
  async onBeforeClose() {
    const vals = await formApi.getValues();
    const fileList = vals.iconUrl;
    // 上传没完成不许关：此刻拿不到 url，关了删不掉，等它传完在后台成孤儿
    if (
      Array.isArray(fileList) &&
      fileList.some((f: any) => f?.status === 'uploading')
    ) {
      message.warning('图标正在上传，请稍候');
      return false;
    }
    // 新增态、没提交、又传了图 → 后台清理孤儿（不 await，弹窗立刻关，避免连点）
    if (!formData.value?.id && !submitted) {
      cleanupOrphanUpload(fileList);
    }
    return true;
  },
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
        submitted = true;
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      submitted = false;
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
    <!-- 隐藏的图片，只借用它的预览层：点上传项预览时弹层放大，不跳新页面 -->
    <AImage
      v-if="previewSrc"
      :src="previewSrc"
      :style="{ display: 'none' }"
      :preview="{
        visible: previewOpen,
        onVisibleChange: (v: boolean) => (previewOpen = v),
      }"
    />
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
