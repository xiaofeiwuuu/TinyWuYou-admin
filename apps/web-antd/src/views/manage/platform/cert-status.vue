<script lang="ts" setup>
import type { OpsStatusApi } from '#/api/manage/ops-status';

import { computed, onMounted, ref } from 'vue';

import { Alert, Card, Descriptions, DescriptionsItem, Tag } from 'ant-design-vue';

import { getOpsStatusApi } from '#/api/manage/ops-status';

/**
 * HTTPS 证书状态。
 *
 * 服务器上 acme.sh 续期成功后会把结果推到后端，这里展示最近一次的结果。
 * 之所以要有这块：证书续期是静默成功的，服务器上换了新证书但没同步到
 * CDN 的话，要等到过期那天全站图片一起挂才会发现。
 */

const loading = ref(true);
const cert = ref<null | OpsStatusApi.Status>(null);

/** 距离证书到期还有多少天；拿不到就返回 null */
const remainDays = computed(() => {
  const expire = cert.value?.detail?.expireAt;
  if (!expire) return null;
  const diff = new Date(expire).getTime() - Date.now();
  return Math.floor(diff / 86_400_000);
});

/** 上报时间距今多久；超过 40 天说明定时任务可能已经不跑了 */
const staleDays = computed(() => {
  if (!cert.value?.reportedAt) return null;
  const diff = Date.now() - new Date(cert.value.reportedAt).getTime();
  return Math.floor(diff / 86_400_000);
});

/**
 * 汇总成一个结论。
 *
 * 三种异常分开判断，因为处理方式完全不同：
 * - failed  ：脚本跑了但失败了，看服务器日志
 * - unknown ：从没收到上报，多半是定时任务没配好或脚本没部署
 * - 快到期  ：脚本可能在跑，但结果不对
 */
const verdict = computed(() => {
  const c = cert.value;
  if (!c) return null;
  if (c.status === 'unknown') {
    return { type: 'warning' as const, text: '尚未收到任何上报，请确认服务器上的证书续期脚本已部署' };
  }
  if (c.status === 'failed') {
    return { type: 'error' as const, text: `上次续期或推送失败：${c.message}` };
  }
  if (remainDays.value !== null && remainDays.value <= 15) {
    return { type: 'error' as const, text: `证书仅剩 ${remainDays.value} 天到期，但尚未续期成功` };
  }
  if (staleDays.value !== null && staleDays.value > 40) {
    return { type: 'warning' as const, text: `已 ${staleDays.value} 天没有收到上报，定时任务可能已停止` };
  }
  return null;
});

async function load() {
  loading.value = true;
  try {
    const data = await getOpsStatusApi();
    cert.value = data.cert;
  } catch {
    cert.value = null;
  } finally {
    loading.value = false;
  }
}

function fmt(iso?: null | string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('zh-CN', { hour12: false });
}

onMounted(load);
</script>

<template>
  <Card :bordered="false" :loading="loading" title="HTTPS 证书">
    <Alert
      v-if="verdict"
      :message="verdict.text"
      :type="verdict.type"
      class="mb-4"
      show-icon
    />

    <Descriptions v-if="cert" :column="1" bordered size="small">
      <DescriptionsItem label="状态">
        <Tag v-if="cert.status === 'ok'" color="success">正常</Tag>
        <Tag v-else-if="cert.status === 'failed'" color="error">失败</Tag>
        <Tag v-else color="default">无上报</Tag>
      </DescriptionsItem>
      <DescriptionsItem label="域名">
        {{ cert.detail?.domain ?? '—' }}
      </DescriptionsItem>
      <DescriptionsItem label="证书到期">
        {{ fmt(cert.detail?.expireAt) }}
        <span v-if="remainDays !== null" class="ml-2 text-gray-400">
          （剩 {{ remainDays }} 天）
        </span>
      </DescriptionsItem>
      <DescriptionsItem label="上次上报">
        {{ fmt(cert.reportedAt) }}
      </DescriptionsItem>
      <DescriptionsItem label="说明">
        {{ cert.message || '—' }}
      </DescriptionsItem>
    </Descriptions>

    <div class="mt-3 text-xs text-gray-400">
      证书由服务器上的 acme.sh 每 60 天自动续期，成功后自动推送到华为云 CDN，
      每次执行都会把结果上报到这里。全程无需人工操作，这块只用来确认它确实在正常运转。
    </div>
  </Card>
</template>
