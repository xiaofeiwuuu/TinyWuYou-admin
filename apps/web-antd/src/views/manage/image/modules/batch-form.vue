<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message, Upload } from 'ant-design-vue';

import { useVbenForm, z } from '#/adapter/form';
import { deleteUploadedFile, uploadFile } from '#/api/core/upload';
import { getCategoryListApi } from '#/api/manage/category';
import { batchImportImagesApi } from '#/api/manage/image';
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';

const emit = defineEmits(['success']);

const uploadedFiles = ref<any[]>([]);
const uploadingCount = ref(0);
const MAX_CONCURRENT_UPLOADS = 3; // 最大并发上传数

// 上传队列
const uploadQueue: Array<() => Promise<void>> = [];
let isProcessingQueue = false;

/**
 * 处理上传队列
 */
async function processQueue() {
  if (isProcessingQueue || uploadQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (
    uploadQueue.length > 0 &&
    uploadingCount.value < MAX_CONCURRENT_UPLOADS
  ) {
    const uploadTask = uploadQueue.shift();
    if (uploadTask) {
      uploadingCount.value++;
      uploadTask().finally(() => {
        uploadingCount.value--;
        processQueue(); // 继续处理队列
      });
    }
  }

  isProcessingQueue = false;
}

/**
 * 带并发控制的上传函数
 */
function uploadFileWithQueue(options: any) {
  return new Promise<void>((resolve) => {
    const uploadTask = async () => {
      try {
        await uploadFile(options);
      } catch (error) {
        console.error('上传失败:', error);
      } finally {
        resolve();
      }
    };

    uploadQueue.push(uploadTask);
    processQueue();
  });
}

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  wrapperClass: 'grid-cols-2',
  schema: [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: IMAGE_TYPE_OPTIONS.map((item) => ({
          label: item.label,
          value: item.value,
        })),
        optionType: 'button',
      },
      defaultValue: 'avatar',
      fieldName: 'imageType',
      label: '图片类型',
      rules: z.string().min(1, '请选择图片类型'),
      formItemClass: 'col-span-2',
    },
    {
      component: 'Select',
      componentProps: {
        class: 'w-full',
        placeholder: '请选择分类',
        options: [],
      },
      dependencies: {
        async componentProps(values) {
          if (values.imageType) {
            const res = await getCategoryListApi({
              contentType: 'image',
              imageType: values.imageType,
              page: 1,
              pageSize: 100,
            });
            return {
              options: res.list.map((item) => ({
                label: item.name,
                value: item.id,
              })),
            };
          }
          return { options: [] };
        },
        triggerFields: ['imageType'],
      },
      fieldName: 'categoryId',
      label: '分类',
      rules: z.string().min(1, '请选择分类'),
      formItemClass: 'col-span-2',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 9999,
        placeholder: '数字越大越靠前',
        class: 'w-full',
      },
      defaultValue: 0,
      fieldName: 'sortOrder',
      label: '排序',
      formItemClass: 'col-span-2',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'isVip',
      label: 'VIP专属',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: 0,
      fieldName: 'isRecommend',
      label: '推荐',
    },
  ],
  showDefaultActions: false,
});

const handleUploadChange = (info: any) => {
  const { fileList } = info;
  uploadedFiles.value = fileList;
};

const handleRemove = async (file: any) => {
  let url = file.response?.url || file.url;
  if (url) {
    // 提取相对路径（去除域名部分）
    if (url.includes('://')) {
      try {
        url = new URL(url).pathname;
      } catch {
        // 保持原值
      }
    }
    try {
      await deleteUploadedFile(url);
    } catch (error) {
      console.error('删除文件失败:', error);
    }
  }
  return true;
};

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      // 检查是否有上传的文件
      const doneFiles = uploadedFiles.value.filter(
        (file: any) => file.status === 'done',
      );

      if (doneFiles.length === 0) {
        message.error('请至少上传一张图片');
        return;
      }

      modalApi.lock();

      const data = await formApi.getValues();

      // 构建批量上传的图片列表
      const images = doneFiles.map((file: any) => {
        const response = file.response;
        let url = response.url;
        let thumbnailUrl = response.thumbnailUrl;

        // 确保只保存相对路径到数据库（去除域名部分）
        if (url && url.includes('://')) {
          try {
            url = new URL(url).pathname;
          } catch {
            console.warn('解析URL失败，使用原始值:', url);
          }
        }

        // 处理缩略图URL
        if (thumbnailUrl && thumbnailUrl.includes('://')) {
          try {
            thumbnailUrl = new URL(thumbnailUrl).pathname;
          } catch {
            console.warn('解析缩略图URL失败，使用原始值:', thumbnailUrl);
          }
        }

        return {
          url,
          thumbnailUrl,
          width: response.width,
          height: response.height,
          aspectRatio: response.aspectRatio,
          size: response.size,
          originalName: response.originalName,
        };
      });

      try {
        await batchImportImagesApi({
          categoryId: Number(data.categoryId),
          imageType: data.imageType,
          isVip: data.isVip,
          isRecommend: data.isRecommend,
          sortOrder: data.sortOrder,
          images,
        });

        message.success(`成功创建 ${images.length} 张图片`);
        modalApi.close();
        emit('success');
      } catch {
        message.error('批量创建失败');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
      uploadedFiles.value = [];
      uploadingCount.value = 0;
      uploadQueue.length = 0; // 清空上传队列
    }
  },
});
</script>

<template>
  <Modal title="批量上传图片" width="800px">
    <div class="mx-4">
      <Form />

      <div class="mt-4">
        <div class="mb-2 text-sm font-medium">上传图片</div>
        <Upload.Dragger
          v-model:file-list="uploadedFiles"
          :custom-request="uploadFileWithQueue"
          :multiple="true"
          accept=".png,.jpg,.jpeg,.webp,.gif"
          list-type="picture"
          @change="handleUploadChange"
          @remove="handleRemove"
        >
          <p class="ant-upload-drag-icon">
            <span class="text-6xl">📁</span>
          </p>
          <p class="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p class="ant-upload-hint">
            支持单次或批量上传，支持 PNG、JPG、WEBP、GIF 格式
            <br />
            <span class="text-xs text-gray-400">
              (最多同时上传 {{ MAX_CONCURRENT_UPLOADS }} 张，其余排队等待)
            </span>
          </p>
        </Upload.Dragger>
      </div>
    </div>

    <template #prepend-footer>
      <div class="flex-auto">
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">
            已完成
            {{ uploadedFiles.filter((f) => f.status === 'done').length }} 张图片
          </span>
          <span
            v-if="uploadingCount > 0 || uploadQueue.length > 0"
            class="text-sm text-blue-500"
          >
            正在上传 {{ uploadingCount }} 张，队列等待
            {{ uploadQueue.length }} 张
          </span>
        </div>
      </div>
    </template>
  </Modal>
</template>
