<script lang="ts" setup>
import type { VirtualPayApi } from '#/api/manage/virtualpay';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { createVirtualPayApi, updateVirtualPayApi } from '#/api/manage/virtualpay';

import { useSchema } from '../data';

const emit = defineEmits(['success']);

const formData = ref<VirtualPayApi.ProductInfo>();

const getTitle = computed(() => (formData.value?.id ? '编辑商品' : '新增商品'));

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useSchema(),
  showDefaultActions: false,
});

const [Modal, modalApi] = useVbenModal({
  class: 'w-[600px]',
  closeOnClickModal: false,
  closeOnPressEscape: false,
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    modalApi.lock();
    const data = await formApi.getValues();
    try {
      await (formData.value?.id
        ? updateVirtualPayApi(formData.value.id, data as VirtualPayApi.SaveParams)
        : createVirtualPayApi(data as VirtualPayApi.SaveParams));
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
    const data = modalApi.getData<VirtualPayApi.ProductInfo>();
    formData.value = data;
    formApi.resetForm();
    if (data) {
      formApi.setValues({
        productId: data.productId,
        name: data.name,
        type: data.type,
        amount: data.amount,
        price: data.price,
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
  </Modal>
</template>
