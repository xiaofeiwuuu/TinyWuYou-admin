<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Button, message } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { batchUpdateCategoryApi } from '#/api/manage/text';
import { getCategoryListApi } from '#/api/manage/category';

const emit = defineEmits(['success']);

// 表单数据
const batchData = ref<{
  selectedIds: number[];
  selectedCount: number;
}>({
  selectedIds: [],
  selectedCount: 0,
});

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: [
    {
      component: 'ApiSelect',
      componentProps: {
        api: async () => {
          const res = await getCategoryListApi({
            contentType: 'text',
            page: 1,
            pageSize: 100,
          });
          return res.list.map((item) => ({ label: item.name, value: item.id }));
        },
        placeholder: '请选择新的分类',
        class: 'w-full',
        style: { width: '100%' },
      },
      fieldName: 'categoryId',
      label: '目标分类',
      rules: 'required',
    },
  ],
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[500px]',
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();

      try {
        await batchUpdateCategoryApi(
          batchData.value.selectedIds,
          Number(data.categoryId)
        );
        message.success(`成功修改 ${batchData.value.selectedCount} 条文案的分类`);
        modalApi.close();
        emit('success');
      } catch (error) {
        message.error('批量修改失败');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<{
        selectedIds: number[];
        selectedCount: number;
      }>();
      if (data) {
        batchData.value = data;
        formApi.resetForm();
      }
    }
  },
  title: computed(() => `批量修改分类 (已选择 ${batchData.value.selectedCount} 条)`),
});
</script>

<template>
  <Modal>
    <div class="mb-4 rounded bg-blue-50 p-3 text-blue-700">
      <p class="text-sm">
        将对选中的 <strong>{{ batchData.selectedCount }}</strong> 条文案进行批量修改分类操作
      </p>
    </div>

    <Form class="mx-4" />

    <template #prepend-footer>
      <div class="flex-auto">
        <Button danger type="primary" @click="formApi.resetForm"> 重置 </Button>
      </div>
    </template>
  </Modal>
</template>
