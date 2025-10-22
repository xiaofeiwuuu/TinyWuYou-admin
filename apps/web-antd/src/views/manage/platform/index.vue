<script lang="ts" setup>
import { Page } from '@vben/common-ui';
import {
  getPlatformListApi,
  updatePlatformsApi,
  type PlatformManageApi,
} from '#/api/manage/platform';
import { Card, Form, Input, Switch, Button, message } from 'ant-design-vue';
import { ref, onMounted } from 'vue';

const platformList = ref<PlatformManageApi.PlatformConfig[]>([]);
const loading = ref(false);
const saving = ref(false);

// 平台图标映射
const platformIcons: Record<string, string> = {
  weixin: '🟢',
  xiaohongshu: '🔴',
  douyin: '⚫',
  alipay: '🔵',
};

// 平台颜色映射
const platformColors: Record<string, string> = {
  weixin: '#07c160',
  xiaohongshu: '#ff2442',
  douyin: '#000000',
  alipay: '#1677ff',
};

// 加载平台列表
const loadPlatforms = async () => {
  loading.value = true;
  try {
    const data = await getPlatformListApi();
    platformList.value = data;
  } catch (error) {
    message.error('加载平台配置失败');
  } finally {
    loading.value = false;
  }
};

// 保存所有平台配置
const handleSaveAll = async () => {
  saving.value = true;
  try {
    const platforms = platformList.value.map((p) => ({
      platform: p.platform,
      platformName: p.platformName,
      appId: p.appId,
      appSecret: p.appSecret,
      isEnabled: p.isEnabled,
      extraConfig: p.extraConfig || '',
    }));

    await updatePlatformsApi(platforms);
    message.success('保存成功');
    await loadPlatforms(); // 重新加载以确保数据同步
  } catch (error) {
    message.error('保存失败');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadPlatforms();
});
</script>

<template>
  <Page auto-content-height>
    <div class="p-6">
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-xl font-semibold">多平台配置</h2>
          <p class="text-sm text-gray-500 mt-1">
            配置不同平台的 AppID 和 AppSecret,支持微信、小红书、抖音、支付宝等平台
          </p>
        </div>
        <Button
          type="primary"
          :loading="saving"
          @click="handleSaveAll"
          size="large"
        >
          保存全部配置
        </Button>
      </div>

      <div v-if="loading" class="text-center py-12">
        <div class="text-gray-400">加载中...</div>
      </div>

      <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          v-for="platform in platformList"
          :key="platform.platform"
          :bordered="false"
          class="shadow-sm hover:shadow-md transition-shadow"
        >
          <template #title>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ platformIcons[platform.platform] || '📱' }}</span>
                <span class="font-semibold" :style="{ color: platformColors[platform.platform] }">
                  {{ platform.platformName }}
                </span>
              </div>
              <Switch
                v-model:checked="platform.isEnabled"
                :checked-value="1"
                :un-checked-value="0"
                checked-children="启用"
                un-checked-children="禁用"
              />
            </div>
          </template>

          <Form layout="vertical">
            <Form.Item label="平台标识">
              <Input
                :value="platform.platform"
                disabled
                placeholder="平台标识"
              />
            </Form.Item>

            <Form.Item label="平台名称">
              <Input
                v-model:value="platform.platformName"
                placeholder="请输入平台名称"
              />
            </Form.Item>

            <Form.Item label="AppID">
              <Input
                v-model:value="platform.appId"
                placeholder="请输入 AppID"
              />
            </Form.Item>

            <Form.Item label="AppSecret">
              <Input.Password
                v-model:value="platform.appSecret"
                placeholder="请输入 AppSecret"
              />
            </Form.Item>

            <Form.Item label="额外配置 (JSON格式)" v-if="false">
              <Input.TextArea
                v-model:value="platform.extraConfig"
                :rows="3"
                placeholder='{"key": "value"}'
              />
            </Form.Item>
          </Form>

          <div class="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
            <div>创建时间: {{ new Date(platform.createdAt).toLocaleString('zh-CN') }}</div>
            <div>更新时间: {{ new Date(platform.updatedAt).toLocaleString('zh-CN') }}</div>
          </div>
        </Card>
      </div>

      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 class="font-semibold text-blue-900 mb-2">💡 使用说明</h3>
        <ul class="text-sm text-blue-800 space-y-1">
          <li>• 配置保存后会自动更新后端 .env 文件中的环境变量</li>
          <li>• 环境变量格式: WEIXIN_APPID, XIAOHONGSHU_APPID, DOUYIN_APPID, ALIPAY_APPID</li>
          <li>• 禁用的平台不会影响已有配置,只是不会在小程序中使用</li>
          <li>• 建议在测试环境验证配置后再应用到生产环境</li>
        </ul>
      </div>
    </div>
  </Page>
</template>

<style scoped>
:deep(.ant-card-head) {
  border-bottom: 2px solid #f0f0f0;
}

:deep(.ant-form-item-label > label) {
  font-weight: 500;
}
</style>
