import { useState, useEffect } from 'react'
import client from '@/api/client'
import KPICard from '@/components/KPICard'
import type { OverviewStats } from '@/types'

// 精简版 Dashboard：仅保留核心 KPI 卡片
function Dashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchOverview = async () => {
      setError('')
      try {
        const res = await client.get<OverviewStats>('/admin/stats/overview')
        setOverview(res.data)
      } catch {
        setError('数据加载失败，请刷新重试')
      } finally {
        setLoading(false)
      }
    }
    fetchOverview()
  }, [])

  const formatNumber = (n: number | undefined | null): string => {
    if (n === undefined || n === null) return '—'
    if (n >= 10000) return (n / 10000).toFixed(1) + '万'
    return n.toLocaleString()
  }

  return (
    <div className="page-container">
      <h1 className="page-title">首页看板</h1>

      {error && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(230, 57, 70, 0.08)',
          color: 'var(--danger)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 128, marginBottom: 0 }}>
              <div className="loading-wrap" style={{ minHeight: 80 }}>加载中…</div>
            </div>
          ))
        ) : (
          <>
            <KPICard title="总用户数" value={formatNumber(overview?.totalUsers)} icon="👥" />
            <KPICard title="7 日活跃用户" value={formatNumber(overview?.activeUsers7d)} icon="🔥" />
            <KPICard title="总记录数" value={formatNumber(overview?.totalRecords)} icon="📝" />
            <KPICard title="7 日新增用户" value={formatNumber(overview?.newUsers7d)} icon="✨" />
          </>
        )}
      </div>

      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
        <p style={{ marginBottom: 8 }}>极简管理后台</p>
        <p style={{ fontSize: 13 }}>核心指标：体重 / BMI / 体脂率 / 腰围 / 睡眠时长</p>
      </div>
    </div>
  )
}

export default Dashboard
