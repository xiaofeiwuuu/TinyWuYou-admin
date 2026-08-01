<script lang="ts" setup>
import type { ImageTypeApi } from '#/api/manage/image-type';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import { createImageTypeApi, updateImageTypeApi } from '#/api/manage/image-type';

import { useSchema } from '../data';

const emit = defineEmits(['success']);
const formData = ref<ImageTypeApi.ImageTypeInfo>();

const isEdit = computed(() => Boolean(formData.value?.id));
const getTitle = computed(() =>
  isEdit.value ? `编辑图片类型 - ${formData.value?.name}` : '新增图片类型',
);

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) {
      return;
    }

    modalApi.lock();
    const data = await formApi.getValues();

    try {
      if (isEdit.value) {
        // code 不参与更新：它是存量数据里实际存储的值
        const { code: _code, ...payload } = data;
        await updateImageTypeApi(
          formData.value!.id,
          payload as ImageTypeApi.UpdateParams,
        );
      } else {
        await createImageTypeApi(data as ImageTypeApi.CreateParams);
      }
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

    const data = modalApi.getData<ImageTypeApi.ImageTypeInfo>();
    formData.value = data;
    // 编辑态要把 code 设成只读，所以 schema 得跟着重建
    formApi.setState({ schema: useSchema(Boolean(data?.id)) });
    formApi.resetForm();
    if (data) {
      formApi.setValues(data);
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
  </Modal>
</template>
