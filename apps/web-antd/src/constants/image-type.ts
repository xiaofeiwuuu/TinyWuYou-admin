/**
 * 图片类型。
 *
 * 类型清单已经从写死的枚举改成后端 image_types 配置表，
 * 这里提供一个带缓存的加载器，页面挂载时拉一次即可。
 *
 * 仍然导出 IMAGE_TYPE_OPTIONS / LABELS / COLORS 这三个同名变量，
 * 是为了让原有的 8 个使用点不用改写法——它们会在 loadImageTypes() 之后被填充。
 */
import { reactive } from 'vue';

import { getImageTypeListApi } from '#/api/manage/image-type';

export type ImageType = string;

export interface ImageTypeOption {
  label: string;
  value: ImageType;
  color: string;
  orientation: string;
}

/**
 * 这四个容器必须是 reactive 的。
 *
 * 它们是全模块共享的单例，图片管理/分类管理页在 setup 阶段就读走了内容。
 * 如果是普通数组，在类型管理页增删改之后重新填充，那些页面不会感知到变化，
 * 会一直显示已经删掉的类型直到刷新浏览器。
 * 用 reactive + 函数形式的 componentProps（跑在 computed 里），改动才能自动传播。
 */

/** 下拉框选项（仅启用）。首次 loadImageTypes() 之前是空数组。用于表单选择 */
export const IMAGE_TYPE_OPTIONS: ImageTypeOption[] = reactive([]);

/** 全部图片类型选项（含禁用）。搜索筛选、列表标签展示用——禁用类型下可能仍有存量数据 */
export const IMAGE_TYPE_OPTIONS_ALL: ImageTypeOption[] = reactive([]);

/** 标签映射（表格展示用） */
export const IMAGE_TYPE_LABELS: Record<string, string> = reactive({});

/** 颜色映射 */
export const IMAGE_TYPE_COLORS: Record<string, string> = reactive({});

/** 朝向映射，客户端布局用；后台一般用不到 */
export const IMAGE_TYPE_ORIENTATIONS: Record<string, string> = reactive({});

let loaded = false;
let loading: null | Promise<void> = null;

/**
 * 加载图片类型配置。
 *
 * 并发调用只会真正请求一次；已加载过则直接返回，
 * 需要强制刷新（比如在类型管理页改完）时传 force。
 */
export async function loadImageTypes(force = false): Promise<void> {
  if (loaded && !force) {
    return;
  }
  if (loading && !force) {
    return loading;
  }

  loading = (async () => {
    let list: Awaited<ReturnType<typeof getImageTypeListApi>>['list'];
    try {
      ({ list } = await getImageTypeListApi());
    } finally {
      // 请求失败时把 loading 清掉，否则后续调用会一直拿到这个已 reject 的 promise
      loading = null;
    }

    // 原地清空再填充，保证已经引用了这些数组/对象的地方能拿到新值
    IMAGE_TYPE_OPTIONS.length = 0;
    IMAGE_TYPE_OPTIONS_ALL.length = 0;
    Object.keys(IMAGE_TYPE_LABELS).forEach((k) => delete IMAGE_TYPE_LABELS[k]);
    Object.keys(IMAGE_TYPE_COLORS).forEach((k) => delete IMAGE_TYPE_COLORS[k]);
    Object.keys(IMAGE_TYPE_ORIENTATIONS).forEach(
      (k) => delete IMAGE_TYPE_ORIENTATIONS[k],
    );

    list.forEach((item) => {
      const opt = {
        label: item.name,
        value: item.code,
        color: item.color,
        orientation: item.orientation,
      };
      // 全部类型（含禁用）：搜索筛选、列表标签展示
      IMAGE_TYPE_OPTIONS_ALL.push(opt);
      // label/color/orientation 用全部，保证禁用类型的存量数据也能正确显示名称/颜色/布局
      IMAGE_TYPE_LABELS[item.code] = item.name;
      IMAGE_TYPE_COLORS[item.code] = item.color;
      IMAGE_TYPE_ORIENTATIONS[item.code] = item.orientation;
      // 仅启用类型进入表单可选项（新数据不该归到禁用类型）
      if (item.isEnabled === 1) {
        IMAGE_TYPE_OPTIONS.push(opt);
      }
    });

    loaded = true;
  })();

  return loading;
}

/**
 * 获取图片类型选项（向后兼容旧代码）
 */
export function getImageTypeOptions() {
  return IMAGE_TYPE_OPTIONS;
}

/** 全部类型选项（含禁用）：搜索筛选、列表标签展示用 */
export function getAllImageTypeOptions() {
  return IMAGE_TYPE_OPTIONS_ALL;
}

/**
 * 新建表单的默认图片类型 = 排序最靠前的那个启用类型。
 *
 * 不能写死成某个 code：类型现在是后台可配置的，写死的那个随时可能被停用或删除，
 * 那样表单会带着一个后端不认的值提交，直接被校验打回 400。
 * 调用前请确保 loadImageTypes() 已完成，否则返回 undefined。
 */
export function getDefaultImageType(): ImageType | undefined {
  return IMAGE_TYPE_OPTIONS[0]?.value;
}
