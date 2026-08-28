export interface AdminInfo {
  id: number | string
  username: string
  role?: string
}

export interface AuthResponse {
  token: string
  admin: AdminInfo
}

// 与后端 /api/admin/stats/overview 响应保持一致（驼峰命名）
export interface OverviewStats {
  totalUsers: number
  activeUsers7d: number
  totalRecords: number
  recordsLast30d: number
  avgWeight: number | null
  avgBMI: number | null
  avgBodyFat: number | null
  avgMuscleMass: number | null
}

// 与后端 /api/admin/stats/records_trend 响应保持一致
export interface TrendPoint {
  date: string
  recordCount: number
  uniqueUsers: number
}

// 与后端分布接口的元素结构保持一致
export interface DistributionItem {
  bucket: string
  count: number
}

export interface CoreMetricsDistribution {
  bmiDistribution: DistributionItem[]
  weightDistribution: DistributionItem[]
  bodyFatDistribution: DistributionItem[]
}

// 与后端 /api/admin/stats/tags_top 响应保持一致
export interface TopTag {
  tag_name: string
  count: number
}

// 与后端 /api/admin/users 列表项保持一致
export interface UserItem {
  id: number | string
  username: string
  nickname: string
  created_at: string
  last_login_at: string | null
  record_count: number
}

// 与后端 /api/admin/users/:id 详情响应保持一致
export interface UserDetailData {
  id: number | string
  username: string
  nickname: string
  created_at: string
  last_login_at: string | null
  totalRecords: number
  firstRecordDate: string | null
  lastRecordDate: string | null
  latestWeight: number | null
  latestBMI: number | null
  latestBodyFat: number | null
  latestMuscleMass: number | null
  waist: number | null
  sleepHours: number | null
}

export interface UsersListResponse {
  list: UserItem[]
  total: number
  page: number
  pageSize: number
}

export interface LoginCredentials {
  username: string
  password: string
}