<script lang="ts" setup>
import type { AppInfoApi } from '#/api/manage/app-info';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button as AButton,
  Card,
  Input,
  InputNumber,
  message,
  Switch,
  Textarea,
  Upload,
} from 'ant-design-vue';

import { getAppInfoApi, updateAppInfoApi } from '#/api/manage/app-info';
import { uploadFile } from '#/api/core/upload';

/**
 * 小程序信息配置。
 *
 * 这里的每一项都会直接出现在小程序界面上（导航栏标题、分享卡片、公告弹窗、
 * 客服页），改完保存即时生效，不用重新发布小程序。
 *
 * 没有用 useVbenForm：公告那块有"开关 + 版本号 + 长文本 + 预览"的联动，
 * schema 化之后反而要绕一圈拿字段值，直接用受控组件更直白。
 */

const loading = ref(false);
const saving = ref(false);

/** 名称/文案的长度上限，与后端 normalize() 的校验保持一致 */
const TEXT_MAX = 100;
const ANNOUNCE_TITLE_MAX = 50;
const ANNOUNCE_CONTENT_MAX = 2000;

const form = reactive<AppInfoApi.AppInfo>({
  app_name: '',
  app_slogan: '',
  faq: [],
  app_logo: '',
  share_title: '',
  contact_info: { wechat: '', email: '', workTime: '' },
  announcement: { enabled: false, title: '', content: '', version: 1 },
});

const logoUploading = ref(false);

/**
 * Logo 上传。
 *
 * 没有用 a-upload 的 fileList 双向绑定：这里只需要一个字符串路径，
 * 维护一份 fileList 数组反而要在加载/清空/失败三处同步，容易不一致。
 * 直接用 customRequest 拿到返回的 url 写进 form 最直白。
 */
function handleLogoUpload(options: any) {
  logoUploading.value = true;
  uploadFile({
    file: options.file,
    onSuccess: (data: any) => {
      form.app_logo = data?.url ?? '';
      logoUploading.value = false;
      message.success('上传成功，记得点下方保存');
    },
    onError: (error: Error) => {
      logoUploading.value = false;
      message.error(error?.message ?? '上传失败');
    },
  });
}

/** 校验放在上传前，避免把不合规的文件先传上去再拒绝，留下孤儿文件 */
function beforeLogoUpload(file: File) {
  const okType = ['image/png', 'image/jpeg', 'image/webp'].includes(file.type);
  if (!okType) {
    message.error('Logo 只支持 PNG / JPG / WEBP');
    return Upload.LIST_IGNORE;
  }
  if (file.size > 2 * 1024 * 1024) {
    message.error('Logo 不能超过 2MB');
    return Upload.LIST_IGNORE;
  }
  return true;
}

/** 载入时的快照，用来判断公告内容是否被改过 */
let originalAnnouncement = '';

const announcementChanged = computed(
  () =>
    JSON.stringify({
      title: form.announcement.title,
      content: form.announcement.content,
    }) !== originalAnnouncement,
);

async function loadData() {
  loading.value = true;
  try {
    const data = await getAppInfoApi();
    form.app_name = data.app_name ?? '';
    form.app_slogan = data.app_slogan ?? '';
    form.faq = Array.isArray(data.faq) ? data.faq.map((f) => ({ ...f })) : [];
    form.app_logo = data.app_logo ?? '';
    form.share_title = data.share_title ?? '';
    form.contact_info = {
      wechat: data.contact_info?.wechat ?? '',
      email: data.contact_info?.email ?? '',
      workTime: data.contact_info?.workTime ?? '',
    };
    form.announcement = {
      enabled: Boolean(data.announcement?.enabled),
      title: data.announcement?.title ?? '',
      content: data.announcement?.content ?? '',
      version: Number(data.announcement?.version) || 1,
    };
    originalAnnouncement = JSON.stringify({
      title: form.announcement.title,
      content: form.announcement.content,
    });
  } catch (error: any) {
    message.error(error?.message ?? '加载失败');
  } finally {
    loading.value = false;
  }
}

async function handleSave() {
  const appName = form.app_name.trim();
  if (!appName) {
    message.error('小程序名称不能为空');
    return;
  }
  if (form.announcement.enabled && !form.announcement.content.trim()) {
    message.error('公告已开启，内容不能为空');
    return;
  }

  saving.value = true;
  try {
    await updateAppInfoApi([
      { key: 'app_name', value: appName },
      { key: 'app_slogan', value: form.app_slogan.trim() },
      // 标题为空的行后端会丢掉，这里不用先过滤
      { key: 'faq', value: form.faq.map((f) => ({ ...f })) },
      { key: 'app_logo', value: form.app_logo },
      { key: 'share_title', value: form.share_title.trim() },
      { key: 'contact_info', value: { ...form.contact_info } },
      { key: 'announcement', value: { ...form.announcement } },
    ]);
    message.success('保存成功');
    await loadData();
  } catch (error: any) {
    message.error(error?.message ?? '保存失败');
  } finally {
    saving.value = false;
  }
}

function addFaq() {
  form.faq.push({ title: '', content: '' });
}

function removeFaq(index: number) {
  form.faq.splice(index, 1);
}

/** 上移一条，方便把常问的排到前面 */
function moveFaqUp(index: number) {
  if (index === 0) return;
  const [item] = form.faq.splice(index, 1);
  form.faq.splice(index - 1, 0, item!);
}

/**
 * 公告改完内容后要手动 +1 版本号才会重新弹给已经看过的用户。
 * 做成显式按钮而不是"内容一变就自动 +1"：改错别字不该惊动全体用户。
 */
function bumpVersion() {
  form.announcement.version = Number(form.announcement.version || 1) + 1;
}

onMounted(loadData);
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <Card :bordered="false" :loading="loading" title="基础信息">
        <div class="mx-auto max-w-3xl space-y-5">
          <div>
            <div class="mb-1 font-medium">Logo</div>
            <div class="flex items-center gap-4">
              <div
                class="flex h-20 w-20 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-800"
              >
                <img
                  v-if="form.app_logo"
                  :src="form.app_logo"
                  alt="Logo"
                  class="h-full w-full object-contain"
                />
                <span v-else class="text-xs text-gray-400">未设置</span>
              </div>
              <div class="flex flex-col gap-2">
                <Upload
                  :before-upload="beforeLogoUpload"
                  :custom-request="handleLogoUpload"
                  :show-upload-list="false"
                  accept=".png,.jpg,.jpeg,.webp"
                >
                  <AButton :loading="logoUploading">
                    {{ form.app_logo ? '更换' : '上传' }}
                  </AButton>
                </Upload>
                <AButton
                  v-if="form.app_logo"
                  danger
                  size="small"
                  type="text"
                  @click="form.app_logo = ''"
                >
                  清除
                </AButton>
              </div>
            </div>
            <div class="mt-1 text-xs text-gray-400">
              PNG / JPG / WEBP，不超过 2MB，建议正方形。留空则使用小程序包内自带的图标。
              这里改的是小程序界面里显示的 Logo，微信聊天列表和搜索结果里的图标要在微信公众平台改。
            </div>
          </div>

          <div>
            <div class="mb-1 font-medium">小程序名称</div>
            <Input
              v-model:value="form.app_name"
              :maxlength="TEXT_MAX"
              placeholder="显示在小程序首页导航栏"
              show-count
            />
            <div class="mt-1 text-xs text-gray-400">
              改这里只影响小程序界面上的显示。微信后台注册的名称是另一回事，
              两边不一致会让用户困惑，建议同步修改。
            </div>
          </div>

          <div>
            <div class="mb-1 font-medium">一句话标语</div>
            <Input
              v-model:value="form.app_slogan"
              :maxlength="TEXT_MAX"
              placeholder="显示在「关于我们」页的名称下方"
              show-count
            />
          </div>

          <div>
            <div class="mb-1 font-medium">分享文案</div>
            <Input
              v-model:value="form.share_title"
              :maxlength="TEXT_MAX"
              placeholder="转发给好友、分享到朋友圈时的标题"
              show-count
            />
            <div class="mt-1 text-xs text-gray-400">
              留空时会自动使用上面的小程序名称。
            </div>
          </div>
        </div>
      </Card>

      <Card :bordered="false" :loading="loading" title="联系方式">
        <div class="mx-auto max-w-3xl space-y-5">
          <div>
            <div class="mb-1 font-medium">客服微信号</div>
            <Input
              v-model:value="form.contact_info.wechat"
              :maxlength="50"
              placeholder="用户可复制添加"
            />
          </div>
          <div>
            <div class="mb-1 font-medium">邮箱</div>
            <Input
              v-model:value="form.contact_info.email"
              :maxlength="100"
              placeholder="例如 support@example.com"
            />
          </div>
          <div>
            <div class="mb-1 font-medium">工作时间</div>
            <Input
              v-model:value="form.contact_info.workTime"
              :maxlength="100"
              placeholder="例如 工作日 9:00-18:00"
            />
          </div>
        </div>
      </Card>

      <Card :bordered="false" :loading="loading" title="常见问题">
        <div class="mx-auto max-w-3xl space-y-4">
          <div
            v-for="(item, index) in form.faq"
            :key="index"
            class="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
          >
            <div class="mb-2 flex items-center gap-2">
              <span class="text-sm font-medium text-gray-500">{{ index + 1 }}</span>
              <Input
                v-model:value="item.title"
                :maxlength="60"
                class="flex-1"
                placeholder="问题标题"
              />
              <AButton
                :disabled="index === 0"
                size="small"
                title="上移"
                @click="moveFaqUp(index)"
              >
                ↑
              </AButton>
              <AButton danger size="small" @click="removeFaq(index)">删除</AButton>
            </div>
            <Textarea
              v-model:value="item.content"
              :auto-size="{ minRows: 2, maxRows: 8 }"
              :maxlength="1000"
              placeholder="回答内容"
              show-count
            />
          </div>

          <div v-if="form.faq.length === 0" class="py-8 text-center text-sm text-gray-400">
            还没有任何问题，小程序里「常见问题」页会显示空态
          </div>

          <AButton block type="dashed" @click="addFaq">+ 添加一条</AButton>

          <div class="text-xs text-gray-400">
            顺序即小程序里的显示顺序，把用户最常问的排在前面。
            标题留空的条目保存时会被自动丢弃。
          </div>
        </div>
      </Card>

      <Card :bordered="false" :loading="loading" title="公告弹窗">
        <div class="mx-auto max-w-3xl space-y-5">
          <div class="flex items-center gap-3">
            <Switch v-model:checked="form.announcement.enabled" />
            <span class="text-sm">
              {{ form.announcement.enabled ? '已开启，用户进入小程序会看到' : '已关闭' }}
            </span>
          </div>

          <div>
            <div class="mb-1 font-medium">标题</div>
            <Input
              v-model:value="form.announcement.title"
              :maxlength="ANNOUNCE_TITLE_MAX"
              placeholder="例如：服务升级通知"
              show-count
            />
          </div>

          <div>
            <div class="mb-1 font-medium">内容</div>
            <Textarea
              v-model:value="form.announcement.content"
              :auto-size="{ minRows: 4, maxRows: 12 }"
              :maxlength="ANNOUNCE_CONTENT_MAX"
              placeholder="支持换行，纯文本"
              show-count
            />
          </div>

          <div>
            <div class="mb-1 font-medium">版本号</div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model:value="form.announcement.version"
                :min="1"
                :precision="0"
                class="w-32"
              />
              <AButton size="small" @click="bumpVersion">+1（重新弹给所有人）</AButton>
            </div>
            <div class="mt-1 text-xs text-gray-400">
              每个用户对同一个版本号只会看到一次公告。改完内容后把版本号 +1，
              所有人（包括已经看过的）会再看到一次；只是修个错别字就不用动它。
            </div>
            <div
              v-if="announcementChanged"
              class="mt-2 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950 dark:text-amber-400"
            >
              公告内容已修改。如果希望已经看过的用户再看一次，记得把版本号 +1 再保存。
            </div>
          </div>
        </div>
      </Card>

      <div class="flex justify-center pb-4">
        <AButton :loading="saving" size="large" type="primary" @click="handleSave">
          保存全部配置
        </AButton>
      </div>
    </div>
  </Page>
</template>
