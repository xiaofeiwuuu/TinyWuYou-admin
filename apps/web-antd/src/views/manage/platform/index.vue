<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { Page, useVbenForm } from '@vben/common-ui';
import { Card, Button as AButton, message } from 'ant-design-vue';
import {
  getPlatformListApi,
  updatePlatformsApi,
  type PlatformManageApi,
} from '#/api/manage/platform';
import {
  getSystemConfigListApi,
  updateSystemConfigApi,
} from '#/api/manage/system-config';
import { z } from '#/adapter/form';

const loading = ref(false);
const platformDisabled = ref(true);
const configDisabled = ref(true);
const weixinPlatform = ref<PlatformManageApi.PlatformConfig | null>(null);

// 微信平台配置表单
const [PlatformForm, platformFormApi] = useVbenForm({
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
      fieldName: 'platform',
      label: '平台标识',
      componentProps: {
        placeholder: '平台标识',
        disabled: true,
      },
      rules: z.string(),
    },
    {
      component: 'Input',
      fieldName: 'platformName',
      label: '平台名称',
      componentProps: {
        placeholder: '请输入平台名称',
        disabled: true,
      },
      rules: z.string(),
    },
    {
      component: 'Input',
      fieldName: 'appId',
      label: 'AppID',
      componentProps: {
        placeholder: '请输入 AppID',
        disabled: true,
      },
      rules: z.string(),
    },
    {
      component: 'InputPassword',
      fieldName: 'appSecret',
      label: 'AppSecret',
      componentProps: {
        placeholder: '请输入 AppSecret',
        disabled: true,
      },
      rules: z.string(),
    },
  ],
  showDefaultActions: false,
});

// 系统配置表单
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
        max: 10000,
      },
      rules: z.number().min(0),
    },
  ],
  showDefaultActions: false,
});

// 加载微信平台配置
async function loadPlatformConfig() {
  try {
    const data = await getPlatformListApi();
    const weixin = data.find((p) => p.platform === 'weixin');
    if (weixin) {
      weixinPlatform.value = weixin;
      await platformFormApi.setValues({
        platform: weixin.platform,
        platformName: weixin.platformName,
        appId: weixin.appId,
        appSecret: weixin.appSecret,
      });
    }
  } catch (error) {
    message.error('加载微信配置失败');
  }
}

// 加载系统配置
async function loadSystemConfig() {
  try {
    console.log('开始加载系统配置...');
    const configs = await getSystemConfigListApi();
    console.log('配置列表:', configs);

    const dailyLimit = configs.find(
      (c) => c.configKey === 'daily_download_limit',
    );
    const vipLimit = configs.find(
      (c) => c.configKey === 'vip_daily_download_limit',
    );
    console.log('找到的配置 - dailyLimit:', dailyLimit, 'vipLimit:', vipLimit);

    const formValues = {
      daily_download_limit: dailyLimit ? Number(dailyLimit.configValue) : 20,
      vip_daily_download_limit: vipLimit ? Number(vipLimit.configValue) : 0,
    };
    console.log('设置表单值:', formValues);

    await configFormApi.setValues(formValues);
  } catch (error) {
    console.error('加载系统配置失败:', error);
    message.error('加载系统配置失败');
  }
}

// 编辑微信配置
function handleEditPlatform() {
  platformFormApi.setState((prev) => {
    return {
      schema: prev.schema?.map((item) => ({
        ...item,
        componentProps: {
          ...item.componentProps,
          disabled: item.fieldName === 'platform', // 平台标识始终禁用
        },
      })),
    };
  });
  platformDisabled.value = false;
}

// 取消编辑微信配置
function handleCancelPlatform() {
  platformFormApi.setState((prev) => {
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
  platformDisabled.value = true;
  loadPlatformConfig();
}

// 保存微信配置
async function handleSavePlatform() {
  loading.value = true;
  try {
    const { valid } = await platformFormApi.validate();
    if (!valid) {
      loading.value = false;
      return;
    }

    const values = await platformFormApi.getValues();
    await updatePlatformsApi([
      {
        platform: values.platform,
        platformName: values.platformName,
        appId: values.appId,
        appSecret: values.appSecret,
        isEnabled: weixinPlatform.value?.isEnabled || 1,
        extraConfig: weixinPlatform.value?.extraConfig || '',
      },
    ]);
    message.success('保存成功');

    // 先加载新数据
    await loadPlatformConfig();

    // 加载完成后再禁用表单
    platformFormApi.setState((prev) => {
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
    platformDisabled.value = true;
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    loading.value = false;
  }
}

// 编辑系统配置
function handleEditConfig() {
  configFormApi.setState((prev) => {
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
  configDisabled.value = false;
}

// 取消编辑系统配置
function handleCancelConfig() {
  configFormApi.setState((prev) => {
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
  configDisabled.value = true;
  loadSystemConfig();
}

// 保存系统配置
async function handleSaveConfig() {
  loading.value = true;
  try {
    const { valid } = await configFormApi.validate();
    if (!valid) {
      loading.value = false;
      return;
    }

    const values = await configFormApi.getValues();
    console.log('获取到的表单值:', values);

    // 确保值不为 undefined
    const dailyLimit = values.daily_download_limit ?? 20;
    const vipLimit = values.vip_daily_download_limit ?? 0;
    console.log('处理后的值 - dailyLimit:', dailyLimit, 'vipLimit:', vipLimit);

    // 更新普通用户限制
    const req1 = {
      configKey: 'daily_download_limit',
      configValue: String(dailyLimit),
      configDesc: '用户每日最大下载次数(0为不限制)',
      valueType: 'number',
    };
    console.log('发送请求1:', req1);
    const res1 = await updateSystemConfigApi(req1);
    console.log('请求1响应:', res1);

    // 更新VIP用户限制
    const req2 = {
      configKey: 'vip_daily_download_limit',
      configValue: String(vipLimit),
      configDesc: 'VIP用户每日最大下载次数(0为不限制)',
      valueType: 'number',
    };
    console.log('发送请求2:', req2);
    const res2 = await updateSystemConfigApi(req2);
    console.log('请求2响应:', res2);

    message.success('保存成功');

    console.log('重新加载配置...');
    await loadSystemConfig();

    // 加载完成后再禁用表单
    configFormApi.setState((prev) => {
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
    configDisabled.value = true;
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPlatformConfig();
  loadSystemConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <!-- 微信平台配置 -->
      <Card title="微信小程序配置" :bordered="false">
        <template #extra>
          <a-button
            v-if="platformDisabled"
            type="primary"
            @click="handleEditPlatform"
          >
            修改
          </a-button>
        </template>

        <div class="mx-auto max-w-3xl">
          <PlatformForm />

          <div v-if="!platformDisabled" class="mt-4 flex gap-2">
            <a-button
              type="primary"
              :loading="loading"
              @click="handleSavePlatform"
            >
              保存配置
            </a-button>
            <a-button @click="handleCancelPlatform"> 取消 </a-button>
          </div>
        </div>
      </Card>

      <!-- 系统配置 -->
      <Card title="系统配置" :bordered="false">
        <template #extra>
          <a-button
            v-if="configDisabled"
            type="primary"
            @click="handleEditConfig"
          >
            修改
          </a-button>
        </template>

        <div class="mx-auto max-w-3xl">
          <ConfigForm />

          <div v-if="!configDisabled" class="mt-4 flex gap-2">
            <a-button
              type="primary"
              :loading="loading"
              @click="handleSaveConfig"
            >
              保存配置
            </a-button>
            <a-button @click="handleCancelConfig"> 取消 </a-button>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>
