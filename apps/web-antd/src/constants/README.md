# 常量目录说明

本目录存放项目中的公共常量定义，便于统一管理和维护。

## 文件说明

### image-type.ts

图片类型相关的常量定义，包括：

- `ImageType` - 图片类型的 TypeScript 类型定义
- `IMAGE_TYPE_OPTIONS` - 图片类型选项数组（用于表单组件）
- `IMAGE_TYPE_LABELS` - 图片类型标签映射
- `IMAGE_TYPE_COLORS` - 图片类型颜色映射
- `getImageTypeOptions()` - 获取图片类型选项的函数（向后兼容）

#### 使用示例

```typescript
// 1. 引入类型
import type { ImageType } from '#/constants/image-type';

// 2. 引入选项（用于表单）
import { IMAGE_TYPE_OPTIONS } from '#/constants/image-type';

const options = IMAGE_TYPE_OPTIONS.map(item => ({
  label: item.label,
  value: item.value
}));

// 3. 引入标签映射（用于显示）
import { IMAGE_TYPE_LABELS } from '#/constants/image-type';

const label = IMAGE_TYPE_LABELS['avatar']; // '头像'

// 4. 向后兼容用法
import { getImageTypeOptions } from '#/constants/image-type';

const options = getImageTypeOptions();
```

## 添加新类型

当需要添加新的图片类型时，只需修改 `image-type.ts` 一个文件即可：

1. 修改 `ImageType` 类型定义
2. 在 `IMAGE_TYPE_OPTIONS` 数组中添加新选项
3. 在 `IMAGE_TYPE_LABELS` 对象中添加标签
4. 在 `IMAGE_TYPE_COLORS` 对象中添加颜色

所有使用这些常量的地方会自动更新，无需逐个修改！

## 优势

✅ **统一管理**：所有图片类型定义集中在一个文件
✅ **类型安全**：TypeScript 类型检查确保类型正确
✅ **易于维护**：添加新类型只需修改一处
✅ **避免重复**：避免在多个文件中重复定义
✅ **自动同步**：所有引用自动获取最新定义
