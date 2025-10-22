/**
 * 图片类型常量
 * 统一管理所有图片类型相关的定义
 */

/** 图片类型枚举值 */
export type ImageType = 'avatar' | 'wallpaper' | 'pc_wallpaper' | 'emoji' | 'sticker';

/** 图片类型选项（用于下拉框、单选框等） */
export const IMAGE_TYPE_OPTIONS = [
  { label: '头像', value: 'avatar' as ImageType, color: 'blue' },
  { label: '手机壁纸', value: 'wallpaper' as ImageType, color: 'green' },
  { label: '平板/电脑壁纸', value: 'pc_wallpaper' as ImageType, color: 'cyan' },
  { label: '表情包', value: 'emoji' as ImageType, color: 'orange' },
  { label: '贴纸', value: 'sticker' as ImageType, color: 'purple' },
] as const;

/** 图片类型标签映射（用于表格显示） */
export const IMAGE_TYPE_LABELS: Record<ImageType, string> = {
  avatar: '头像',
  wallpaper: '手机壁纸',
  pc_wallpaper: '平板/电脑壁纸',
  emoji: '表情包',
  sticker: '贴纸',
};

/** 图片类型颜色映射（用于标签颜色） */
export const IMAGE_TYPE_COLORS: Record<ImageType, string> = {
  avatar: 'blue',
  wallpaper: 'green',
  pc_wallpaper: 'cyan',
  emoji: 'orange',
  sticker: 'purple',
};

/**
 * 获取图片类型选项（向后兼容旧代码）
 */
export function getImageTypeOptions() {
  return IMAGE_TYPE_OPTIONS;
}
