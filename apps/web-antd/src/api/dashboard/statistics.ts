import { requestClient } from '#/api/request';

export namespace StatisticsApi {
  export interface OverviewData {
    id: number;
    date: string;
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    totalImages: number;
    newImages: number;
    totalTexts: number;
    newTexts: number;
    totalDownloads: number;
    dailyDownloads: number;
    vipUsers: number;
    totalCollections: number;
    createdAt: string;
    updatedAt: string;
  }

  export interface DailyStatistics {
    id: number;
    date: string;
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
    totalImages: number;
    newImages: number;
    totalTexts: number;
    newTexts: number;
    totalDownloads: number;
    dailyDownloads: number;
    vipUsers: number;
    totalCollections: number;
    createdAt: string;
    updatedAt: string;
  }
}

/**
 * 获取概览统计数据
 */
export async function getOverviewStatisticsApi() {
  return requestClient.get<StatisticsApi.OverviewData>(
    '/admin/statistics/overview',
  );
}

/**
 * 获取最近N天的统计数据
 */
export async function getRecentStatisticsApi(days: number = 30) {
  return requestClient.get<StatisticsApi.DailyStatistics[]>(
    '/admin/statistics/recent',
    { params: { days } },
  );
}

/**
 * 手动更新统计数据
 */
export async function updateStatisticsApi() {
  return requestClient.get<StatisticsApi.OverviewData>(
    '/admin/statistics/update',
  );
}

/**
 * 按日期范围获取用户统计
 */
export async function getUserStatsByDateRangeApi(startDate: string, endDate: string) {
  return requestClient.get<Array<{ date: string; newUsers: number }>>(
    '/admin/statistics/users/daily',
    { params: { startDate, endDate } },
  );
}

/**
 * 按月份获取用户统计
 */
export async function getUserStatsByMonthApi(year: number) {
  return requestClient.get<Array<{ month: string; newUsers: number }>>(
    '/admin/statistics/users/monthly',
    { params: { year } },
  );
}

/**
 * 按日期范围获取 VIP 用户统计
 */
export async function getVipStatsByDateRangeApi(startDate: string, endDate: string) {
  return requestClient.get<Array<{ date: string; newVips: number }>>(
    '/admin/statistics/vips/daily',
    { params: { startDate, endDate } },
  );
}

/**
 * 按月份获取 VIP 用户统计
 */
export async function getVipStatsByMonthApi(year: number) {
  return requestClient.get<Array<{ month: string; newVips: number }>>(
    '/admin/statistics/vips/monthly',
    { params: { year } },
  );
}

/**
 * 按日期范围获取下载统计
 */
export async function getDownloadStatsByDateRangeApi(startDate: string, endDate: string) {
  return requestClient.get<Array<{ date: string; downloads: number }>>(
    '/admin/statistics/downloads/daily',
    { params: { startDate, endDate } },
  );
}

/**
 * 按月份获取下载统计
 */
export async function getDownloadStatsByMonthApi(year: number) {
  return requestClient.get<Array<{ month: string; downloads: number }>>(
    '/admin/statistics/downloads/monthly',
    { params: { year } },
  );
}
