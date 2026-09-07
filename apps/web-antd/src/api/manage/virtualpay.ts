import { requestClient } from '#/api/request';

export namespace VirtualPayApi {
  /** 列表查询参数 */
  export interface ListParams {
    page?: number;
    pageSize?: number;
    name?: string;
    type?: string; // vip / download
  }

  /** 虚拟商品信息 */
  export interface ProductInfo {
    id: number;
    productId: string;
    name: string;
    type: string; // 'vip' | 'download'
    amount: number; // vip=天数 / download=次数
    price: number; // 单位：分
    sortOrder: number;
    isEnabled: number; // 1 启用 0 禁用
    createdAt: string;
  }

  /** 分页返回 */
  export interface ListResult {
    list: ProductInfo[];
    total: number;
    page: number;
    pageSize: number;
  }

  /** 新增/编辑提交参数 */
  export interface SaveParams {
    productId: string;
    name: string;
    type: string;
    amount: number;
    price: number;
    sortOrder?: number;
    isEnabled?: number;
  }
}

/** 商品列表（分页） */
export async function getVirtualPayListApi(params: VirtualPayApi.ListParams) {
  return requestClient.get<VirtualPayApi.ListResult>('/admin/virtualpay/products', {
    params,
  });
}

/** 新增商品 */
export async function createVirtualPayApi(data: VirtualPayApi.SaveParams) {
  return requestClient.post('/admin/virtualpay/products', data);
}

/** 更新商品（后端用 POST /:id） */
export async function updateVirtualPayApi(
  id: number,
  data: Partial<VirtualPayApi.SaveParams>,
) {
  return requestClient.post(`/admin/virtualpay/products/${id}`, data);
}

/** 删除商品（后端用 POST /:id/delete） */
export async function deleteVirtualPayApi(id: number) {
  return requestClient.post(`/admin/virtualpay/products/${id}/delete`);
}

export namespace VirtualPayApi {
  /** 购买订单 */
  export interface OrderInfo {
    id: number;
    outTradeNo: string;
    userId: number;
    uid: string;
    nickname: string;
    productId: string;
    productType: string; // vip / download
    amount: number;
    price: number; // 分
    status: string; // pending/paid/delivered/failed
    wxOrderId: string | null;
    deliveredAt: string | null;
    createdAt: string;
  }
  export interface OrderListResult {
    list: OrderInfo[];
    total: number;
    page: number;
    pageSize: number;
  }
}

/** 购买订单列表（独立页，按用户名 / UID 两个独立远程搜索） */
export async function getVirtualOrderListApi(params: {
  uid?: string;
  nickname?: string;
  page?: number;
  pageSize?: number;
}) {
  return requestClient.get<VirtualPayApi.OrderListResult>('/admin/virtualpay/orders', {
    params,
  });
}

/** 后台主动退款（Android 等；iOS 由 Apple 决定，微信会返回错误） */
export async function refundVirtualOrderApi(outTradeNo: string) {
  return requestClient.post(`/admin/virtualpay/orders/${outTradeNo}/refund`);
}
