<script lang="ts" setup>
import type { AnnouncementApi } from '#/api/manage/announcement';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import {
  createAnnouncementApi,
  updateAnnouncementApi,
} from '#/api/manage/announcement';

import { useSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<AnnouncementApi.Info>();

const getTitle = computed(() => (formData.value?.id ? '编辑公告' : '新增公告'));

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[640px]',
  closeOnClickModal: false,
  closeOnPressEscape: false,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    const data = await formApi.getValues();
    try {
      await (formData.value?.id
        ? updateAnnouncementApi(formData.value.id, data as AnnouncementApi.SaveParams)
        : createAnnouncementApi(data as AnnouncementApi.SaveParams));
      message.success('保存成功');
      modalApi.close();
      emit('success');
    } catch {
      message.error('保存失败');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) return;
    const data = modalApi.getData<AnnouncementApi.Info>();
    formData.value = data;
    formApi.resetForm();
    if (data) {
      formApi.setValues({
        title: data.title,
        content: data.content,
        isEnabled: data.isEnabled,
      });
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
