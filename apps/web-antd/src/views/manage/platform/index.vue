<script lang="ts" setup>
import type { PlatformManageApi } from '#/api/manage/platform';

import { onMounted, ref } from 'vue';

import { Page, useVbenForm } from '@vben/common-ui';

import { Button as AButton, Card, message } from 'ant-design-vue';

import { z } from '#/adapter/form';
import { getAdConfigApi, updateAdConfigApi } from '#/api/manage/ad';
import { getPlatformListApi, updatePlatformsApi } from '#/api/manage/platform';

import CertStatus from './cert-status.vue';

const loading = ref(false);
const platformDisabled = ref(true);
const weixinPlatform = ref<null | PlatformManageApi.PlatformConfig>(null);

const adLoading = ref(false);
const adDisabled = ref(true);

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
      componentProps: { placeholder: '平台标识', disabled: true },
      rules: z.string(),
    },
    {
      component: 'Input',
      fieldName: 'platformName',
      label: '平台名称',
      componentProps: { placeholder: '请输入平台名称', disabled: true },
      rules: z.string(),
    },
    {
      component: 'Input',
      fieldName: 'appId',
      label: 'AppID',
      componentProps: { placeholder: '请输入 AppID', disabled: true },
      rules: z.string(),
    },
    {
      component: 'InputPassword',
      fieldName: 'appSecret',
      label: 'AppSecret',
      componentProps: { placeholder: '请输入 AppSecret', disabled: true },
      rules: z.string(),
    },
    // 以下 4 项为虚拟支付配置，序列化后存进 extraConfig
    {
      component: 'Input',
      fieldName: 'offerId',
      label: 'OfferID',
      componentProps: { placeholder: '虚拟支付 OfferID', disabled: true },
    },
    {
      component: 'InputPassword',
      fieldName: 'prodAppKey',
      label: '现网 AppKey',
      componentProps: { placeholder: '虚拟支付现网 AppKey', disabled: true },
    },
    {
      component: 'InputPassword',
      fieldName: 'sandboxAppKey',
      label: '沙箱 AppKey',
      componentProps: { placeholder: '虚拟支付沙箱 AppKey（联调用）', disabled: true },
    },
    {
      component: 'Select',
      fieldName: 'payEnv',
      label: '支付环境',
      componentProps: {
        placeholder: '选择支付环境',
        disabled: true,
        options: [
          { label: '现网（用现网AppKey）', value: 0 },
          { label: '沙箱（用沙箱AppKey，联调）', value: 1 },
        ],
      },
    },
    {
      component: 'Input',
      fieldName: 'pushToken',
      label: '消息推送Token',
      componentProps: {
        placeholder: '与微信「消息推送配置」里的 Token 一致（3-32位英数）',
        disabled: true,
      },
    },
  ],
  showDefaultActions: false,
});

// 广告配置表单(激励视频 / 插屏 / 原生模板广告 ID),独立走 /ad 接口
const [AdForm, adFormApi] = useVbenForm({
  layout: 'horizontal',
  wrapperClass: 'grid-cols-1',
  commonConfig: { componentProps: { class: 'w-full' } },
  schema: [
    {
      component: 'Input',
      fieldName: 'video',
      label: '激励视频广告ID',
      componentProps: { placeholder: '请输入激励视频广告 ID', disabled: true },
      rules: z.string().optional(),
    },
    {
      component: 'Input',
      fieldName: 'interstitial',
      label: '插屏广告ID',
      componentProps: { placeholder: '请输入插屏广告 ID', disabled: true },
      rules: z.string().optional(),
    },
    {
      component: 'Input',
      fieldName: 'native',
      label: '原生模板广告ID',
      componentProps: { placeholder: '请输入原生模板广告 ID', disabled: true },
      rules: z.string().optional(),
    },
  ],
  showDefaultActions: false,
});

async function loadAdConfig() {
  try {
    const res = await getAdConfigApi();
    await adFormApi.setValues(res);
    adDisabled.value = true;
  } catch {
    message.error('加载广告配置失败');
  }
}

function setAdFieldsDisabled(isDisabled: boolean) {
  adFormApi.setState((prev) => ({
    schema: prev.schema?.map((item) => ({
      ...item,
      componentProps: { ...item.componentProps, disabled: isDisabled },
    })),
  }));
}

function handleEditAd() {
  setAdFieldsDisabled(false);
  adDisabled.value = false;
}

function handleCancelAd() {
  setAdFieldsDisabled(true);
  adDisabled.value = true;
  loadAdConfig();
}

async function handleSaveAd() {
  adLoading.value = true;
  try {
    const { valid } = await adFormApi.validate();
    if (!valid) {
      adLoading.value = false;
      return;
    }
    const values = await adFormApi.getValues();
    await updateAdConfigApi(values);
    message.success('广告配置保存成功');
    setAdFieldsDisabled(true);
    adDisabled.value = true;
    await loadAdConfig();
  } catch (error: any) {
    message.error(error?.message || '广告配置保存失败');
  } finally {
    adLoading.value = false;
  }
}

// 加载微信平台配置
async function loadPlatformConfig() {
  try {
    const data = await getPlatformListApi();
    const weixin = data.find((p) => p.platform === 'weixin');
    if (weixin) {
      weixinPlatform.value = weixin;
      // extraConfig 是 JSON 字符串，解析出虚拟支付 4 项回填
      let extra: any = {};
      try {
        extra = weixin.extraConfig ? JSON.parse(weixin.extraConfig) : {};
      } catch {
        extra = {};
      }
      await platformFormApi.setValues({
        platform: weixin.platform,
        platformName: weixin.platformName,
        appId: weixin.appId,
        appSecret: weixin.appSecret,
        offerId: extra.offerId || '',
        prodAppKey: extra.prodAppKey || '',
        sandboxAppKey: extra.sandboxAppKey || '',
        payEnv: Number(extra.payEnv) || 0,
        pushToken: extra.pushToken || '',
      });
    }
  } catch {
    message.error('加载微信配置失败');
  }
}

// 编辑微信配置
function handleEditPlatform() {
  platformFormApi.setState((prev) => ({
    schema: prev.schema?.map((item) => ({
      ...item,
      componentProps: {
        ...item.componentProps,
        disabled: item.fieldName === 'platform', // 平台标识始终禁用
      },
    })),
  }));
  platformDisabled.value = false;
}

// 取消编辑微信配置
function handleCancelPlatform() {
  platformFormApi.setState((prev) => ({
    schema: prev.schema?.map((item) => ({
      ...item,
      componentProps: { ...item.componentProps, disabled: true },
    })),
  }));
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
    // 虚拟支付 4 项序列化进 extraConfig
    const extraConfig = JSON.stringify({
      offerId: values.offerId || '',
      prodAppKey: values.prodAppKey || '',
      sandboxAppKey: values.sandboxAppKey || '',
      payEnv: Number(values.payEnv) || 0,
      pushToken: values.pushToken || '',
    });
    await updatePlatformsApi([
      {
        platform: values.platform,
        platformName: values.platformName,
        appId: values.appId,
        appSecret: values.appSecret,
        isEnabled: weixinPlatform.value?.isEnabled || 1,
        extraConfig,
      },
    ]);
    message.success('保存成功');

    await loadPlatformConfig();
    platformFormApi.setState((prev) => ({
      schema: prev.schema?.map((item) => ({
        ...item,
        componentProps: { ...item.componentProps, disabled: true },
      })),
    }));
    platformDisabled.value = true;
  } catch (error: any) {
    message.error(error?.message || '保存失败');
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadPlatformConfig();
  loadAdConfig();
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <!-- 放在最上面：证书出问题时全站图片会挂，这类状态埋在页面下方等于没有 -->
      <CertStatus />

      <!-- 微信平台配置 -->
      <Card title="微信小程序配置" :bordered="false">
        <template #extra>
          <AButton
            v-if="platformDisabled"
            type="primary"
            @click="handleEditPlatform"
          >
            修改
          </AButton>
        </template>

        <div class="mx-auto max-w-3xl">
          <PlatformForm />

          <div v-if="!platformDisabled" class="mt-4 flex gap-2">
            <AButton
              type="primary"
              :loading="loading"
              @click="handleSavePlatform"
            >
              保存配置
            </AButton>
            <AButton @click="handleCancelPlatform"> 取消 </AButton>
          </div>

          <div class="mt-3 text-xs text-gray-400">
            AppID / OfferID / AppKey 在微信「虚拟支付」开通后获取;消息推送 Token 在
            公众平台「开发管理 → 消息推送」里扫码开启。
            <a
              class="text-blue-500 hover:underline"
              href="https://mp.weixin.qq.com/"
              target="_blank"
              rel="noopener noreferrer"
            >微信公众平台 ›</a>
          </div>
        </div>
      </Card>

      <!-- 广告配置(小程序流量主广告位 ID) -->
      <Card title="广告配置" :bordered="false">
        <template #extra>
          <AButton v-if="adDisabled" type="primary" @click="handleEditAd">
            修改
          </AButton>
        </template>

        <div class="mx-auto max-w-3xl">
          <AdForm />

          <div v-if="!adDisabled" class="mt-4 flex gap-2">
            <AButton type="primary" :loading="adLoading" @click="handleSaveAd">
              保存配置
            </AButton>
            <AButton @click="handleCancelAd"> 取消 </AButton>
          </div>

          <div class="mt-3 text-xs text-gray-400">
            广告位 ID 需在微信公众平台「流量主」创建广告位后填入(小程序累计 UV≥1000
            且无违规方可开通)。
            <a
              class="text-blue-500 hover:underline"
              href="https://mp.weixin.qq.com/"
              target="_blank"
              rel="noopener noreferrer"
            >前往开通 ›</a>
            <a
              class="ml-2 text-blue-500 hover:underline"
              href="https://developers.weixin.qq.com/community/develop/doc/000046f02244a041da79753e557009"
              target="_blank"
              rel="noopener noreferrer"
            >开通流程 ›</a>
          </div>
        </div>
      </Card>
    </div>
  </Page>
</template>
