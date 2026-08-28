import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import client from '@/api/client'
import KPICard from '@/components/KPICard'
import type { UserDetailData } from '@/types'

// 精简版用户详情：移除肌肉量等冗余字段
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

  const fmtInt = (n: number | null | undefined): string => {
    if (n === undefined || n === null) return '—'
    return n.toLocaleString()
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm">← 返回</button>
          <h1 className="page-title" style={{ marginBottom: 0 }}>用户详情</h1>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{ minHeight: 300 }}>
          <div className="loading-wrap">加载中…</div>
        </div>
      ) : error ? (
        <div className="card" style={{ minHeight: 300 }}>
          <div className="error-wrap">{error}</div>
        </div>
      ) : !user ? (
        <div className="card" style={{ minHeight: 300 }}>
          <div className="error-wrap">用户不存在</div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'var(--primary-bg)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 700,
              }}>
                {(user.nickname || user.username).charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {user.nickname || user.username}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>
                  @{user.username} · ID {user.id}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                  <span>注册时间：{user.created_at}</span>
                </div>
              </div>
              <Link to="/dashboard/users" className="btn btn-secondary btn-sm">查看全部用户</Link>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}>
            <KPICard title="累计记录数" value={fmtInt(user.recordCount)} icon="📝" />
            <KPICard title="用户 ID" value={String(user.id)} icon="🆔" />
            <KPICard title="注册时间" value={user.created_at?.slice(0, 10) || '—'} icon="📅" />
          </div>
        </>
      )}
    </div>
  )
}

export default UserDetail
