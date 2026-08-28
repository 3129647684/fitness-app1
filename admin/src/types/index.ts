// 管理后台类型定义（适配精简后的5核心字段）

export interface AdminInfo {
  id: number | string
  username: string
}

export interface AuthResponse {
  token: string
  admin: AdminInfo
}

// 总览统计（与 /api/admin/stats/overview 响应一致）
export interface OverviewStats {
  totalUsers: number
  activeUsers7d: number
  totalRecords: number
  newUsers7d: number
}

// 记录趋势点（与 /api/admin/stats/growth 响应一致）
export interface TrendPoint {
  date: string
  count: number
}

// 指标统计（与 /api/admin/stats/records 响应一致）
export interface MetricStats {
  count: number
  avg: number | null
  min: number | null
  max: number | null
}

export interface RecordsStatsResponse {
  metrics: Record<string, MetricStats>
}

// 用户列表项（与 /api/admin/users 响应一致）
export interface UserItem {
  id: number | string
  username: string
  nickname: string | null
  created_at: string
  updated_at: string
}

export interface UsersListResponse {
  users: UserItem[]
  total: number
  page: number
  pageSize: number
}

// 用户详情（与 /api/admin/users/:id 响应一致）
export interface UserDetailData {
  id: number | string
  username: string
  nickname: string | null
  created_at: string
  updated_at: string
  recordCount: number
}

export interface LoginCredentials {
  username: string
  password: string
}
