<script lang="ts" setup>
import type { TaskManageApi } from '#/api/manage/task';

import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Button } from 'ant-design-vue';
import { useVbenForm } from '#/adapter/form';
import { createTaskApi, updateTaskApi } from '#/api/manage/task';
import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<TaskManageApi.TaskInfo>();

const getTitle = computed(() => {
  return formData.value?.id ? '编辑任务' : '新增任务';
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

      try {
        await (formData.value?.id
          ? updateTaskApi(formData.value.id, data as TaskManageApi.SaveParams)
          : createTaskApi(data as TaskManageApi.SaveParams));
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData<TaskManageApi.TaskInfo>();
      if (data) {
        formData.value = data;
        formApi.setValues(data);
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
