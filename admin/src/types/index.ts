export interface AdminInfo {
  id: number | string
  username: string
  nickname?: string
}

export interface AuthResponse {
  token: string
  admin: AdminInfo
}

export interface OverviewStats {
  total_users: number
  active_users_7d: number
  total_records: number
  new_users_30d: number
  avg_weight: number
  avg_bmi: number
}

export interface TrendPoint {
  date: string
  count: number
}

export interface DistributionItem {
  range: string
  count: number
}

export interface CoreMetricsDistribution {
  bmi_distribution: DistributionItem[]
  weight_distribution: DistributionItem[]
  body_fat_distribution: DistributionItem[]
}

export interface TopTag {
  tag: string
  count: number
}

export interface UserItem {
  id: number | string
  username: string
  nickname: string
  registered_at: string
  last_login: string | null
  records_count: number
}

export interface UserDetailData {
  id: number | string
  username: string
  nickname: string
  registered_at: string
  last_login: string | null
  records_count: number
  latest_weight: number | null
  latest_bmi: number | null
  latest_body_fat: number | null
  latest_muscle_mass: number | null
  total_workouts: number
  avg_calories_per_day: number
  height: number | null
  gender: string | null
  weight_trend_30d: TrendPoint[]
}

export interface UsersListResponse {
  data: UserItem[]
  total: number
  page: number
  page_size: number
}

export interface LoginCredentials {
  username: string
  password: string
}
