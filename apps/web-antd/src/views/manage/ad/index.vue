<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page, useVbenForm } from '@vben/common-ui';

import { Button as AButton, Card, message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { getAdConfigApi, updateAdConfigApi } from '#/api/manage/ad';

const loading = ref(false);
const disabled = ref(true);

const [Form, formApi] = useVbenForm({
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1',
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'Input',
      fieldName: 'video',
      label: '激励视频广告ID',
      componentProps: {
        placeholder: '请输入激励视频广告 ID',
        disabled: true,
      },
      rules: z.string().optional(),
    },
    {
      component: 'Input',
      fieldName: 'interstitial',
      label: '插屏广告ID',
      componentProps: {
        placeholder: '请输入插屏广告 ID',
        disabled: true,
      },
      rules: z.string().optional(),
    },
    {
      component: 'Input',
      fieldName: 'native',
      label: '原生模板广告ID',
      componentProps: {
        placeholder: '请输入原生模板广告 ID',
        disabled: true,
      },
      rules: z.string().optional(),
    },
  ],
  showDefaultActions: false,
});

async function loadConfig() {
  try {
    const res = await getAdConfigApi();
    await formApi.setValues(res);
    disabled.value = true;
  } catch {
    message.error('加载配置失败');
  }
}

function handleEdit() {
  formApi.setState((prev) => {
    return {
      schema: prev.schema?.map((item) => ({
        ...item,
        componentProps: {
          ...item.componentProps,
          disabled: false,
        },
      })),
    };
  });
  disabled.value = false;
}

function handleCancel() {
  formApi.setState((prev) => {
    return {
      schema: prev.schema?.map((item) => ({
        ...item,
        componentProps: {
          ...item.componentProps,
          disabled: true,
        },
      })),
    };
  });
  disabled.value = true;
  loadConfig();
}

async function handleSave() {
  loading.value = true;
  try {
    const { valid } = await formApi.validate();
    if (!valid) {
      loading.value = false;
      return;
    }

    const values = await formApi.getValues();
    await updateAdConfigApi(values);
    message.success('保存成功');
    // 禁用表单
    formApi.setState((prev) => {
      return {
        schema: prev.schema?.map((item) => ({
          ...item,
          componentProps: {
            ...item.componentProps,
            disabled: true,
          },
        })),
      };
    });
    disabled.value = true;
    await loadConfig();
  } catch (error: any) {
    if (error?.message) {
      message.error(error.message);
    } else {
      message.error('保存失败');
    }
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadConfig();
});
</script>

<template>
  <Page auto-content-height>
    <Card title="广告配置" :bordered="false">
      <template #extra>
        <AButton v-if="disabled" type="primary" @click="handleEdit">
          修改
        </AButton>
      </template>

      <div class="mx-auto max-w-3xl">
        <Form />

        <div v-if="!disabled" class="mt-4 flex gap-2">
          <AButton type="primary" :loading="loading" @click="handleSave">
            保存配置
          </AButton>
          <AButton @click="handleCancel"> 取消 </AButton>
        </div>
      </div>
    </Card>
  </Page>
</template>
