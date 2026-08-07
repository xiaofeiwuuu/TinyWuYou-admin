<script lang="ts" setup>
import type { ImageManageApi } from '#/api/manage/image';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Image as AImage, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { deleteUploadedFile } from '#/api/core/upload';
import { createImageApi, updateImageApi } from '#/api/manage/image';
import { loadImageTypes } from '#/constants/image-type';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ImageManageApi.ImageInfo>();
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
  return formData.value?.id ? '编辑图片' : '新增图片';
});

// 图片预览：点已上传的图弹层放大，而不是 antd 默认的打开新标签页
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
  wrapperClass: 'grid-cols-2',
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
    const fileList = vals.imageUrl;
    // 上传没完成不许关：此刻拿不到 url，关了删不掉，等它传完在后台成孤儿
    if (
      Array.isArray(fileList) &&
      fileList.some((f: any) => f?.status === 'uploading')
    ) {
      message.warning('图片正在上传，请稍候');
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

      // 处理图片上传,提取 URL 和元数据
      if (data.imageUrl && Array.isArray(data.imageUrl)) {
        const files = data.imageUrl;
        const doneFile = files.find((file: any) => file.status === 'done');

        // response 已经是数据对象(被拦截器提取过),不需要 .data
        let url = doneFile?.response?.url || doneFile?.url || '';

        // 确保只保存相对路径到数据库（去除域名部分）
        if (url && url.includes('://')) {
          try {
            url = new URL(url).pathname;
          } catch {
            console.warn('解析URL失败，使用原始值:', url);
          }
        }
        data.imageUrl = url;

        // 自动填充图片宽高、文件大小和哈希值
        if (doneFile?.response) {
          const metadata = doneFile.response;
          data.width = metadata.width;
          data.height = metadata.height;
          data.aspectRatio = metadata.aspectRatio;
          data.fileSize = metadata.size;
          data.fileHash = metadata.fileHash;
          data.perceptualHash = metadata.perceptualHash;
        }
      }

      try {
        await (formData.value?.id
          ? updateImageApi(formData.value.id, data as ImageManageApi.SaveParams)
          : createImageApi(data as ImageManageApi.SaveParams));
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
      const data = modalApi.getData<ImageManageApi.ImageInfo>();
      if (data) {
        formData.value = data;

        // 编辑模式：禁止删除图片
        formApi.updateSchema([
          {
            fieldName: 'imageUrl',
            componentProps: {
              showUploadList: { showRemoveIcon: false },
            },
          },
        ]);

        // 转换图片 URL 为 Upload 组件期望的格式
        const formValues = { ...data };

        // Upload 的 fileList 只接受数组。历史数据里存在 image_url 为空的记录，
        // 空字符串原样传给 Upload 会抛 .map is not a function，所以要兜底成 []
        formValues.imageUrl =
          formValues.imageUrl && typeof formValues.imageUrl === 'string'
            ? [
                {
                  uid: '-1',
                  name: formValues.imageUrl.split('/').pop() || 'image',
                  status: 'done',
                  url: formValues.imageUrl,
                },
              ]
            : Array.isArray(formValues.imageUrl)
              ? formValues.imageUrl
              : [];

        formApi.setValues(formValues);
        // 不 await：选项是响应式的，加载完会自动填进下拉框，
        // 放在 setValues 之前 await 会让表单先渲染一帧空值
        loadImageTypes();
      } else {
        formData.value = undefined;

        // 新增模式：允许删除图片
        formApi.updateSchema([
          {
            fieldName: 'imageUrl',
            componentProps: {
              showUploadList: true,
            },
          },
        ]);

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
