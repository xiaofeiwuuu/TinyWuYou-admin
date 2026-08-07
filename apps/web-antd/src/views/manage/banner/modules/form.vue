<script lang="ts" setup>
import type { BannerApi } from '#/api/manage/banner';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Image as AImage, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { deleteUploadedFile } from '#/api/core/upload';
import { createBannerApi, updateBannerApi } from '#/api/manage/banner';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<BannerApi.BannerInfo>();
// 是否已成功提交：决定关闭弹窗时要不要清理"传了图但没保存"的孤儿文件
let submitted = false;

/**
 * 清理本次新上传、但最终没保存进库的图片，避免 OBS 留下无人引用的孤儿文件。
 * fileList 是 Upload 的值，取每项上传返回的 url，剥成相对路径再删。
 */
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
      // 清理失败不影响关闭，最坏是留个孤儿文件
    }
  }
}

const getTitle = computed(() => (formData.value?.id ? '编辑轮播图' : '新增轮播图'));

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
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  // 点遮罩 / 按 ESC 不关弹窗，避免误触把填了一半的表单关掉
  closeOnClickModal: false,
  closeOnPressEscape: false,
  async onBeforeClose() {
    const vals = await formApi.getValues();
    const fileList = vals.imageUrl;

    // 上传还没完成时不许关：此刻文件拿不到 url，关了就删不掉，等它传完在后台变成孤儿。
    // 提示一下让用户知道为什么关不掉（上传通常几秒），传完再关就能正常清理。
    if (
      Array.isArray(fileList) &&
      fileList.some((f: any) => f?.status === 'uploading')
    ) {
      message.warning('图片正在上传，请稍候');
      return false;
    }

    // 新增态、没提交成功、又传了图 → 清理孤儿（提交成功的图已被引用、编辑态的原图都不删）。
    // 关键：不 await —— 弹窗立刻关闭，删除请求在后台跑。
    // 之前 await 会让弹窗卡到删完才关，用户以为没反应就连点，删接口被调好几次。
    if (!formData.value?.id && !submitted) {
      cleanupOrphanUpload(fileList);
    }
    return true;
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }
    modalApi.lock();
    const data = await formApi.getValues();

    // Upload 字段是 fileList 数组，提取相对路径存库（与图片管理一致）
    if (Array.isArray(data.imageUrl)) {
      const doneFile = data.imageUrl.find((f: any) => f.status === 'done');
      let url = doneFile?.response?.url || doneFile?.url || '';
      if (url && url.includes('://')) {
        try {
          url = new URL(url).pathname;
        } catch {
          // 保持原值
        }
      }
      data.imageUrl = url;
    }

    try {
      await (formData.value?.id
        ? updateBannerApi(formData.value.id, data as BannerApi.SaveParams)
        : createBannerApi(data as BannerApi.SaveParams));
      // 标记已保存：图片已被记录引用，onBeforeClose 不再当孤儿删掉
      submitted = true;
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      return;
    }
    // 每次打开重置提交标记
    submitted = false;
    const data = modalApi.getData<BannerApi.BannerInfo>();
    formData.value = data;
    formApi.resetForm();

    // 编辑态去掉图片的删除 icon：点它会触发 onRemove 把已保存的图删掉，是误操作。
    // 想换图就删掉整条轮播重建。新增态保留删除，方便传错了重选。
    formApi.updateSchema([
      {
        fieldName: 'imageUrl',
        componentProps: {
          showUploadList: data?.id ? { showRemoveIcon: false } : true,
        },
      },
    ]);

    if (data) {
      // 相对路径原值转成 Upload 期望的 fileList；用完整地址做预览 url
      const raw = data.imageUrlRaw || '';
      formApi.setValues({
        imageUrl: raw
          ? [
              {
                uid: '-1',
                name: raw.split('/').pop() || 'banner',
                status: 'done',
                // 列表项预览用完整地址，回传时 onConfirm 再剥回相对路径
                url: data.imageUrl,
                response: { url: raw },
              },
            ]
          : [],
        categoryId: data.categoryId ?? undefined,
        sortOrder: data.sortOrder,
        isEnabled: data.isEnabled,
      });
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
  </Modal>
</template>

<style scoped>
/* 已达 maxCount 时隐藏上传按钮 */
:deep(.ant-upload-wrapper.ant-upload-picture-card-wrapper)
  .ant-upload-list-item-container
  ~ .ant-upload {
  display: none;
}
</style>
