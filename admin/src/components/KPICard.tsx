interface KPICardProps {
  title: string
  value: string | number
  icon?: string
  change?: number | string
  changeLabel?: string
}

function KPICard({ title, value, icon, change, changeLabel }: KPICardProps) {
  const isPositive = typeof change === 'number' ? change > 0 : null
  const changeStr = typeof change === 'number'
    ? `${change > 0 ? '+' : ''}${change}${changeLabel || '%'}`
    : change
    ? String(change)
    : null

  return (
    <div className="card" style={{
      padding: 20,
      marginBottom: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: 'var(--primary-bg)',
        opacity: 0.5,
      }} />
      <div style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            {title}
          </span>
          {icon && <span style={{ fontSize: 20 }}>{icon}</span>}
        </div>
        <div style={{
          fontSize: 28,
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1.2,
          marginBottom: 8,
        }}>
          {value}
        </div>
        {changeStr ? (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 12,
            fontWeight: 500,
            background: isPositive === true
              ? 'rgba(64, 145, 108, 0.1)'
              : isPositive === false
              ? 'rgba(230, 57, 70, 0.1)'
              : 'var(--bg-body)',
            color: isPositive === true
              ? 'var(--primary-light)'
              : isPositive === false
              ? 'var(--danger)'
              : 'var(--text-muted)',
          }}>
            {isPositive === true && <span>↑</span>}
            {isPositive === false && <span>↓</span>}
            {changeStr}
          </div>
        ) : (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px 8px',
            borderRadius: 4,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}>
            —
          </div>
        )}
      </div>
    </div>
  )
}

export default KPICard
