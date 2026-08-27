import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client from '@/api/client'
import KPICard from '@/components/KPICard'
import TrendLineChart from '@/components/TrendLineChart'
import type { UserDetailData } from '@/types'

function UserDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [user, setUser] = useState<UserDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    const fetchUser = async () => {
      setLoading(true)
      setError('')
      try {
        const res = await client.get<UserDetailData>(`/admin/users/${id}`)
        setUser(res.data)
      } catch {
        setError('加载用户详情失败，请稍后重试')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [id])

  const fmt = (n: number | null | undefined, digits = 1): string => {
    if (n === undefined || n === null) return '—'
    return n.toFixed(digits)
  }

  const fmtInt = (n: number | null | undefined): string => {
    if (n === undefined || n === null) return '—'
    return n.toLocaleString()
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary btn-sm"
          >
            ← 返回
          </button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>用户详情</h1>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ minHeight: 400 }}>
          <div className="loading-wrap">加载中…</div>
        </div>
      ) : error ? (
        <div className="card" style={{ minHeight: 400 }}>
          <div className="error-wrap">{error}</div>
        </div>
      ) : !user ? (
        <div className="card" style={{ minHeight: 400 }}>
          <div className="error-wrap">用户不存在</div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'var(--primary-bg)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 700,
              }}>
                {(user.nickname || user.username).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {user.nickname}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  @{user.username} · ID {user.id}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>性别：{user.gender || '—'}</span>
                  <span>身高：{user.height ? user.height + ' cm' : '—'}</span>
                  <span>注册时间：{user.registered_at}</span>
                  <span>最近登录：{user.last_login || '—'}</span>
                </div>
              </div>
              <Link to="/dashboard/users" className="btn btn-secondary btn-sm">
                查看全部用户
              </Link>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 20,
          }}>
            <KPICard title="最新体重 (kg)" value={fmt(user.latest_weight)} icon="⚖️" />
            <KPICard title="最新 BMI" value={fmt(user.latest_bmi)} icon="📏" />
            <KPICard title="最新体脂率 (%)" value={fmt(user.latest_body_fat)} icon="💧" />
            <KPICard title="肌肉量 (kg)" value={fmt(user.latest_muscle_mass)} icon="💪" />
            <KPICard title="累计记录数" value={fmtInt(user.records_count)} icon="📝" />
            <KPICard title="训练总次数" value={fmtInt(user.total_workouts)} icon="🏋️" />
            <KPICard title="日均卡路里" value={fmtInt(user.avg_calories_per_day)} icon="🔥" />
            <KPICard title="累计记录天数" value={fmtInt(user.weight_trend_30d?.length || 0)} icon="📅" />
          </div>

          <TrendLineChart
            data={user.weight_trend_30d || []}
            title="最近 30 天体重趋势 (kg)"
            height={320}
          />
        </>
      )}
    </div>
  )
}

export default UserDetail
