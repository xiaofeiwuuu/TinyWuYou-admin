<script lang="ts" setup>
import type { VipManageApi } from '#/api/manage/vip';

import { computed } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, message } from 'ant-design-vue';

import { useVbenForm } from '#/adapter/form';
import { generateVipCardsApi } from '#/api/manage/vip';

import { useSchema } from '../data';

const emit = defineEmits(['success']);

const getTitle = computed(() => '批量生成VIP卡');

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  schema: useSchema(),
  showDefaultActions: false,
});

function resetForm() {
  formApi.resetForm();
}

const [Modal, modalApi] = useVbenModal({
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (valid) {
      modalApi.lock();
      const data = await formApi.getValues();
      try {
        const result = await generateVipCardsApi(data as VipManageApi.GenerateParams);
        message.success(`成功生成 ${result.count} 张VIP卡`);
        modalApi.close();
        emit('success');
      } finally {
        modalApi.lock(false);
      }
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      formApi.resetForm();
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form class="mx-4" />
    <template #prepend-footer>
      <div class="flex-auto">
        <Button type="primary" danger @click="resetForm">
          重置
        </Button>
      </div>
    </template>
  </Modal>
</template>
