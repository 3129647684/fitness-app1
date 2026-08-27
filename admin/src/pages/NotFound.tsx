import { Link } from 'react-router-dom'

function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-body)',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 48,
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
        maxWidth: 420,
        width: '100%',
      }}>
        <div style={{
          fontSize: 72,
          fontWeight: 700,
          color: 'var(--primary)',
          lineHeight: 1,
          marginBottom: 16,
        }}>
          404
        </div>
        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 12,
        }}>
          页面不存在
        </h2>
        <p style={{
          color: 'var(--text-muted)',
          fontSize: 14,
          marginBottom: 28,
        }}>
          您访问的页面可能已被移除或链接有误。
        </p>
        <Link to="/dashboard" className="btn btn-primary" style={{ width: '100%' }}>
          返回首页
        </Link>
      </div>
    </div>
  )
}

export default NotFound
