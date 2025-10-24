<script lang="ts" setup>
import type { VbenFormSchema } from '#/adapter/form';

import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { batchUpdateImagesApi } from '#/api/manage/image';
import { getCategoryListApi } from '#/api/manage/category';
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';

const emit = defineEmits(['success']);
const batchData = ref<{ selectedIds: number[]; selectedCount: number }>();

const getTitle = computed(() => {
  return `批量编辑图片 (已选择 ${batchData.value?.selectedCount || 0} 张)`;
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: [
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '保持不变', value: undefined },
          ...IMAGE_TYPE_OPTIONS.map(item => ({ label: item.label, value: item.value })),
        ],
        optionType: 'button',
      },
      defaultValue: undefined,
      fieldName: 'imageType',
      label: '图片类型',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Select',
      componentProps: {
        allowClear: true,
        placeholder: '保持不变',
        options: [],
      },
      dependencies: {
        async componentProps(values) {
          if (values.imageType) {
            const res = await getCategoryListApi({
              contentType: 'image',
              imageType: values.imageType,
              page: 1,
              pageSize: 100
            });
            return {
              options: res.list.map((item) => ({ label: item.name, value: item.id })),
            };
          }
          const res = await getCategoryListApi({
            contentType: 'image',
            page: 1,
            pageSize: 100
          });
          return {
            options: res.list.map((item) => ({ label: item.name, value: item.id })),
          };
        },
        triggerFields: ['imageType'],
      },
      fieldName: 'categoryId',
      label: '分类',
      formItemClass: 'col-span-2',
    },
    {
      component: 'InputNumber',
      componentProps: {
        min: 0,
        max: 9999,
        placeholder: '保持不变',
        class: 'w-full',
      },
      fieldName: 'sortOrder',
      label: '排序权重',
      help: '数字越大越靠前',
      formItemClass: 'col-span-2',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '保持不变', value: undefined },
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: undefined,
      fieldName: 'isVip',
      label: 'VIP专属',
      formItemClass: 'col-span-2',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '保持不变', value: undefined },
          { label: '否', value: 0 },
          { label: '是', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: undefined,
      fieldName: 'isRecommend',
      label: '推荐',
      formItemClass: 'col-span-2',
    },
    {
      component: 'RadioGroup',
      componentProps: {
        buttonStyle: 'solid',
        options: [
          { label: '保持不变', value: undefined },
          { label: '禁用', value: 0 },
          { label: '启用', value: 1 },
        ],
        optionType: 'button',
      },
      defaultValue: undefined,
      fieldName: 'status',
      label: '状态',
      formItemClass: 'col-span-2',
    },
    {
      component: 'Textarea',
      componentProps: {
        maxLength: 255,
        rows: 3,
        showCount: true,
        placeholder: '保持不变',
        class: 'w-full',
      },
      fieldName: 'description',
      label: '描述',
      formItemClass: 'col-span-2',
    },
  ] as VbenFormSchema[],
  showDefaultActions: false,
  wrapperClass: 'grid-cols-2',
});

function resetForm() {
  formApi.resetForm();
}

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const values = await formApi.getValues();

      // 过滤掉未设置的字段
      const updateData: any = {};
      if (values.categoryId !== undefined && values.categoryId !== null) {
        updateData.categoryId = values.categoryId;
      }
      if (values.imageType !== undefined && values.imageType !== null) {
        updateData.imageType = values.imageType;
      }
      if (values.isVip !== undefined && values.isVip !== null) {
        updateData.isVip = values.isVip;
      }
      if (values.isRecommend !== undefined && values.isRecommend !== null) {
        updateData.isRecommend = values.isRecommend;
      }
      if (values.sortOrder !== undefined && values.sortOrder !== null) {
        updateData.sortOrder = values.sortOrder;
      }
      if (values.description !== undefined && values.description !== null && values.description !== '') {
        updateData.description = values.description;
      }
      if (values.status !== undefined && values.status !== null) {
        updateData.status = values.status;
      }

      // 检查是否至少修改了一个字段
      if (Object.keys(updateData).length === 0) {
        message.warning('请至少修改一个字段');
        modalApi.lock(false);
        return;
      }

      try {
        await batchUpdateImagesApi({
          ids: batchData.value?.selectedIds || [],
          updateData,
        });

        message.success(`成功更新 ${batchData.value?.selectedCount} 张图片`);
        modalApi.close();
        emit('success');
      } catch (error: any) {
        message.error(error.message || '批量更新失败');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{ selectedIds: number[]; selectedCount: number }>();
      if (data) {
        batchData.value = data;
      }
      formApi.resetForm();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle" class="w-[660px]">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <Button type="primary" danger @click="resetForm">重置</Button>
      </div>
    </template>
  </Modal>
</template>
