import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '@/api/client'
import type { UsersListResponse, UserItem } from '@/types'

const PAGE_SIZE = 20

function Users() {
  const navigate = useNavigate()
  const [data, setData] = useState<UserItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [dialog, setDialog] = useState<{ type: 'reset' | 'delete'; user: UserItem | null }>({ type: 'reset', user: null })
  const [newPassword, setNewPassword] = useState('')
  const [dialogLoading, setDialogLoading] = useState(false)
  const [dialogError, setDialogError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await client.get<UsersListResponse>('/admin/users', {
        params: {
          page,
          pageSize: PAGE_SIZE,
          search: search || undefined,
        },
      })
      setData(res.data.list)
      setTotal(res.data.total)
    } catch {
      setError('加载失败，请刷新重试')
    } finally {
      setLoading(false)
    }
  }, [page, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleResetSubmit = async () => {
    if (!dialog.user) return
    setDialogError('')
    if (!newPassword || newPassword.length < 6) {
      setDialogError('密码至少 6 位')
      return
    }
    setDialogLoading(true)
    try {
      await client.post(`/admin/users/${dialog.user.id}/reset_password`, { password: newPassword })
      setSuccessMsg('密码已重置')
      setDialog({ type: 'reset', user: null })
      setNewPassword('')
      setTimeout(() => setSuccessMsg(''), 2500)
    } catch {
      setDialogError('重置失败，请稍后重试')
    } finally {
      setDialogLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!dialog.user) return
    setDialogLoading(true)
    setDialogError('')
    try {
      await client.delete(`/admin/users/${dialog.user.id}`)
      setSuccessMsg('用户已删除')
      setDialog({ type: 'delete', user: null })
      await fetchData()
      setTimeout(() => setSuccessMsg(''), 2500)
    } catch {
      setDialogError('删除失败，请稍后重试')
    } finally {
      setDialogLoading(false)
    }
  }

  return (
    <div className="page-container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="page-title" style={{ marginBottom: 0 }}>用户列表</h1>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            className="form-input"
            placeholder="搜索用户名/昵称"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{ width: 240 }}
          />
          <button type="submit" className="btn btn-primary">搜索</button>
        </form>
      </div>

      {successMsg && (
        <div style={{
          padding: '10px 16px',
          background: 'rgba(64, 145, 108, 0.1)',
          color: 'var(--primary-light)',
          borderRadius: 'var(--radius-sm)',
          fontSize: 13,
          marginBottom: 16,
        }}>
          {successMsg}
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className="loading-wrap" style={{ minHeight: 320 }}>加载中…</div>
        ) : error ? (
          <div className="error-wrap" style={{ minHeight: 320 }}>{error}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-body)' }}>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>用户名</th>
                    <th style={thStyle}>昵称</th>
                    <th style={thStyle}>注册时间</th>
                    <th style={thStyle}>最近登录</th>
                    <th style={thStyle}>记录数</th>
                    <th style={{ ...thStyle, textAlign: 'right', paddingRight: 20 }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
                        暂无数据
                      </td>
                    </tr>
                  ) : (
                    data.map((u) => (
                      <tr key={u.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                        <td style={tdStyle}>{u.id}</td>
                        <td style={tdStyle}>{u.username}</td>
                        <td style={tdStyle}>{u.nickname}</td>
                        <td style={tdStyle}>{u.created_at}</td>
                        <td style={tdStyle}>{u.last_login_at || '—'}</td>
                        <td style={tdStyle}>{u.record_count.toLocaleString()}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', paddingRight: 20 }}>
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <button className="btn btn-link btn-sm" onClick={() => navigate(`/dashboard/users/${u.id}`)}>详情</button>
                            <button className="btn btn-link btn-sm" onClick={() => { setDialog({ type: 'reset', user: u }); setNewPassword(''); setDialogError('') }}>重置密码</button>
                            <button className="btn btn-link btn-sm" style={{ color: 'var(--danger)' }} onClick={() => { setDialog({ type: 'delete', user: u }); setDialogError('') }}>删除</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: '1px solid var(--border-color)',
              fontSize: 13,
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: 12,
            }}>
              <div>共 {total} 条 · 第 {page} / {totalPages} 页</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  上一页
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1
                  if (totalPages > 5) {
                    if (page > 3) pageNum = page - 2 + i
                    if (page > totalPages - 2) pageNum = totalPages - 4 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      className="btn btn-sm"
                      onClick={() => setPage(pageNum)}
                      style={{
                        background: pageNum === page ? 'var(--primary)' : 'transparent',
                        color: pageNum === page ? '#fff' : 'var(--text-primary)',
                        border: '1px solid ' + (pageNum === page ? 'var(--primary)' : 'var(--border-color)'),
                      }}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  下一页
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {dialog.user && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: 24,
        }} onClick={() => !dialogLoading && setDialog({ type: 'reset', user: null })}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              maxWidth: 440,
              width: '100%',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <h3 style={{
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-primary)',
              marginBottom: 16,
            }}>
              {dialog.type === 'reset' ? '重置密码' : '确认删除'}
            </h3>

            {dialog.type === 'reset' ? (
              <>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>
                  为用户 <strong style={{ color: 'var(--text-primary)' }}>{dialog.user.username}</strong> 重置密码
                </p>
                <div className="form-group">
                  <label className="form-label">新密码</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="至少 6 位"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={dialogLoading}
                  />
                </div>
              </>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8 }}>
                确定要删除用户 <strong style={{ color: 'var(--danger)' }}>{dialog.user.username}</strong> 吗？
              </p>
            )}

            {dialogError && (
              <div style={{
                padding: '8px 12px',
                background: 'rgba(230, 57, 70, 0.08)',
                color: 'var(--danger)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                marginBottom: 16,
              }}>
                {dialogError}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={dialogLoading}
                onClick={() => setDialog({ type: 'reset', user: null })}
              >
                取消
              </button>
              <button
                className="btn btn-sm"
                disabled={dialogLoading}
                onClick={dialog.type === 'reset' ? handleResetSubmit : handleDelete}
                style={{
                  background: dialog.type === 'delete' ? 'var(--danger)' : 'var(--primary)',
                  color: '#fff',
                }}
              >
                {dialogLoading ? '处理中…' : dialog.type === 'reset' ? '确认重置' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle: React.CSSProperties = {
  padding: '12px 16px',
  textAlign: 'left',
  fontWeight: 600,
  color: 'var(--text-primary)',
  fontSize: 13,
}

const tdStyle: React.CSSProperties = {
  padding: '12px 16px',
  color: 'var(--text-primary)',
  fontSize: 13,
}

export default Users
