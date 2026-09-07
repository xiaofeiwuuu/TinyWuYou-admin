<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import { Page, useVbenForm } from '@vben/common-ui';

import { Button as AButton, Card, message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import {
  getSystemConfigListApi,
  updateSystemConfigApi,
} from '#/api/manage/system-config';

const loading = ref(false);
const configDisabled = ref(true);

const [ConfigForm, configFormApi] = useVbenForm({
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1',
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  schema: [
    {
      component: 'InputNumber',
      fieldName: 'daily_download_limit',
      label: '普通用户每日下载限制',
      componentProps: {
        placeholder: '请输入下载次数限制(0为不限制)',
        disabled: true,
        min: 0,
        max: 1000,
      },
      rules: z.number().min(0),
    },
    {
      component: 'InputNumber',
      fieldName: 'vip_daily_download_limit',
      label: 'VIP用户每日下载限制',
      componentProps: {
        placeholder: '请输入下载次数限制(0为不限制)',
        disabled: true,
        min: 0,
        max: 10_000,
      },
      rules: z.number().min(0),
    },
  ],
  showDefaultActions: false,
});

async function loadConfig() {
  try {
    const configs = await getSystemConfigListApi();
    const dailyLimit = configs.find((c) => c.configKey === 'daily_download_limit');
    const vipLimit = configs.find((c) => c.configKey === 'vip_daily_download_limit');
    await configFormApi.setValues({
      daily_download_limit: dailyLimit ? Number(dailyLimit.configValue) : 20,
      vip_daily_download_limit: vipLimit ? Number(vipLimit.configValue) : 0,
    });
  } catch (error) {
    console.error('加载下载限制失败:', error);
    message.error('加载下载限制失败');
  }
}

function setSchemaDisabled(disabled: boolean) {
  configFormApi.setState((prev) => ({
    schema: prev.schema?.map((item) => ({
      ...item,
      componentProps: { ...item.componentProps, disabled },
    })),
  }));
}

function handleEdit() {
  setSchemaDisabled(false);
  configDisabled.value = false;
}

function handleCancel() {
  setSchemaDisabled(true);
  configDisabled.value = true;
  loadConfig();
}

async function handleSave() {
  loading.value = true;
  try {
    const { valid } = await configFormApi.validate();
    if (!valid) {
      loading.value = false;
      return;
    }
    const values = await configFormApi.getValues();
    const dailyLimit = values.daily_download_limit ?? 20;
    const vipLimit = values.vip_daily_download_limit ?? 0;

    await updateSystemConfigApi({
      configKey: 'daily_download_limit',
      configValue: String(dailyLimit),
      configDesc: '用户每日最大下载次数(0为不限制)',
      valueType: 'number',
    });
    await updateSystemConfigApi({
      configKey: 'vip_daily_download_limit',
      configValue: String(vipLimit),
      configDesc: 'VIP用户每日最大下载次数(0为不限制)',
      valueType: 'number',
    });

    message.success('保存成功');
    await loadConfig();
    setSchemaDisabled(true);
    configDisabled.value = true;
  } catch (error: any) {
    message.error(error?.message || '保存失败');
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
    <Card title="下载限制" :bordered="false">
      <template #extra>
        <AButton v-if="configDisabled" type="primary" @click="handleEdit">
          修改
        </AButton>
      </template>

      <div class="mx-auto max-w-3xl">
        <ConfigForm />

        <div v-if="!configDisabled" class="mt-4 flex gap-2">
          <AButton type="primary" :loading="loading" @click="handleSave">
            保存配置
          </AButton>
          <AButton @click="handleCancel"> 取消 </AButton>
        </div>
      </div>
    </Card>
  </Page>
</template>
