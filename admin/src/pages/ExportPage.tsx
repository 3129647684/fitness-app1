import { useState } from 'react'
import client from '@/api/client'

function ExportPage() {
  const [exportingUsers, setExportingUsers] = useState(false)
  const [exportingRecords, setExportingRecords] = useState(false)
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3000)
  }

  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const handleExportUsers = async () => {
    setExportingUsers(true)
    try {
      const res = await client.get('/admin/export/users.csv', { responseType: 'blob' })
      const disposition = res.headers['content-disposition'] as string | undefined
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/["']/g, '') || 'users.csv'
        : 'users.csv'
      triggerDownload(res.data as Blob, filename)
      showMsg('success', '用户 CSV 已开始下载')
    } catch {
      showMsg('error', '用户 CSV 导出失败，请稍后重试')
    } finally {
      setExportingUsers(false)
    }
  }

  const handleExportRecords = async () => {
    setExportingRecords(true)
    try {
      const res = await client.get('/admin/export/records.csv', { responseType: 'blob' })
      const disposition = res.headers['content-disposition'] as string | undefined
      const filename = disposition
        ? disposition.split('filename=')[1]?.replace(/["']/g, '') || 'records.csv'
        : 'records.csv'
      triggerDownload(res.data as Blob, filename)
      showMsg('success', '记录 CSV 已开始下载')
    } catch {
      showMsg('error', '记录 CSV 导出失败，请稍后重试')
    } finally {
      setExportingRecords(false)
    }
  }

  return (
    <div className="page-container">
      <h1 className="page-title">数据导出</h1>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: 14,
          marginBottom: 20,
          background: msg.type === 'success'
            ? 'rgba(64, 145, 108, 0.1)'
            : 'rgba(230, 57, 70, 0.08)',
          color: msg.type === 'success' ? 'var(--primary-light)' : 'var(--danger)',
        }}>
          {msg.text}
        </div>
      )}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
      }}>
        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'var(--primary-bg)',
              color: 'var(--primary)',
              fontSize: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              👥
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                导出用户 CSV
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.6 }}>
                导出全部用户的基础信息，包含 ID、用户名、昵称、注册时间、最近登录等字段。
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExportUsers}
                disabled={exportingUsers}
              >
                {exportingUsers ? '导出中…' : '导出用户 CSV'}
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'var(--primary-bg)',
              color: 'var(--primary)',
              fontSize: 28,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              📝
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
                导出记录 CSV
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18, lineHeight: 1.6 }}>
                导出全部健康记录，包含用户信息、体重、BMI、体脂、肌肉量、日期时间等字段。
              </div>
              <button
                className="btn btn-primary"
                onClick={handleExportRecords}
                disabled={exportingRecords}
              >
                {exportingRecords ? '导出中…' : '导出记录 CSV'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title">导出说明</div>
        <ul style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          paddingLeft: 20,
          lineHeight: 1.8,
        }}>
          <li>导出文件格式为 <strong style={{ color: 'var(--text-primary)' }}>.csv</strong>，可用 Excel、Numbers、WPS 或 Google Sheets 打开。</li>
          <li>若数据量较大，导出可能需要数秒，耐心等待即可。</li>
          <li>文件名默认为 <code style={{
            background: 'var(--bg-body)',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 12,
          }}>users_YYYYMMDD.csv</code> 及 <code style={{
            background: 'var(--bg-body)',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 12,
          }}>records_YYYYMMDD.csv</code>。</li>
          <li>如需自定义字段或筛选条件，请联系技术支持。</li>
        </ul>
      </div>
    </div>
  )
}

export default ExportPage
