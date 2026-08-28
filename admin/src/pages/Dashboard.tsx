import { useState, useEffect } from 'react'
import client from '@/api/client'
import KPICard from '@/components/KPICard'
import TrendLineChart from '@/components/TrendLineChart'
import DistributionPieChart from '@/components/DistributionPieChart'
import DistributionBarChart from '@/components/DistributionBarChart'
import TopTagsChart from '@/components/TopTagsChart'
import type { OverviewStats, TrendPoint, CoreMetricsDistribution, TopTag } from '@/types'

function Dashboard() {
  const [overview, setOverview] = useState<OverviewStats | null>(null)
  const [recordsTrend, setRecordsTrend] = useState<TrendPoint[]>([])
  const [metricsDist, setMetricsDist] = useState<CoreMetricsDistribution | null>(null)
  const [topTags, setTopTags] = useState<TopTag[]>([])
  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingTrend, setLoadingTrend] = useState(true)
  const [loadingDist, setLoadingDist] = useState(true)
  const [loadingTags, setLoadingTags] = useState(true)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const fetchAll = async () => {
      setError('')
      try {
        const [ovRes, trendRes, distRes, tagsRes] = await Promise.allSettled([
          client.get<OverviewStats>('/admin/stats/overview'),
          client.get<TrendPoint[]>('/admin/stats/records_trend'),
          client.get<CoreMetricsDistribution>('/admin/stats/core_metrics_distribution'),
          client.get<TopTag[]>('/admin/stats/tags_top'),
        ])

        if (ovRes.status === 'fulfilled') {
          setOverview(ovRes.value.data)
        }
        setLoadingOverview(false)

        if (trendRes.status === 'fulfilled') {
          setRecordsTrend(trendRes.value.data)
        }
        setLoadingTrend(false)

        if (distRes.status === 'fulfilled') {
          setMetricsDist(distRes.value.data)
        }
        setLoadingDist(false)

        if (tagsRes.status === 'fulfilled') {
          setTopTags(tagsRes.value.data)
        }
        setLoadingTags(false)

        const anyFailed = [ovRes, trendRes, distRes, tagsRes].some(r => r.status === 'rejected')
        if (anyFailed) {
          setError('部分数据加载失败，请刷新重试')
        }
      } catch {
        setError('数据加载失败，请刷新重试')
        setLoadingOverview(false)
        setLoadingTrend(false)
        setLoadingDist(false)
        setLoadingTags(false)
      }
    }

    fetchAll()
  }, [])

  const formatNumber = (n: number | undefined | null): string => {
    if (n === undefined || n === null) return '—'
    if (n >= 10000) return (n / 10000).toFixed(1) + '万'
    return n.toLocaleString()
  }

  const formatDecimal = (n: number | undefined | null, digits = 1): string => {
    if (n === undefined || n === null) return '—'
    return n.toFixed(digits)
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
        {loadingOverview ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 128, marginBottom: 0 }}>
              <div className="loading-wrap" style={{ minHeight: 80 }}>加载中…</div>
            </div>
          ))
        ) : (
          <>
            <KPICard
              title="总用户数"
              value={formatNumber(overview?.totalUsers)}
              icon="👥"
            />
            <KPICard
              title="7 日活跃用户"
              value={formatNumber(overview?.activeUsers7d)}
              icon="🔥"
            />
            <KPICard
              title="总记录数"
              value={formatNumber(overview?.totalRecords)}
              icon="📝"
            />
            <KPICard
              title="30 日记录数"
              value={formatNumber(overview?.recordsLast30d)}
              icon="🗓️"
            />
            <KPICard
              title="平均体重 (kg)"
              value={formatDecimal(overview?.avgWeight)}
              icon="⚖️"
            />
            <KPICard
              title="平均 BMI"
              value={formatDecimal(overview?.avgBMI)}
              icon="📏"
            />
          </>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        {loadingTrend ? (
          <div className="card" style={{ height: 340 }}>
            <div className="loading-wrap">加载中…</div>
          </div>
        ) : (
          <TrendLineChart data={recordsTrend} title="30 天记录趋势" />
        )}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 16,
        marginBottom: 20,
      }}>
        {loadingDist ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card" style={{ height: 280 }}>
              <div className="loading-wrap">加载中…</div>
            </div>
          ))
        ) : (
          <>
            {metricsDist?.bmiDistribution && (
              <DistributionBarChart
                data={metricsDist.bmiDistribution}
                title="BMI 分布"
              />
            )}
            {metricsDist?.weightDistribution && (
              <DistributionPieChart
                data={metricsDist.weightDistribution}
                title="体重分布"
              />
            )}
            {metricsDist?.bodyFatDistribution && (
              <DistributionPieChart
                data={metricsDist.bodyFatDistribution}
                title="体脂率分布"
              />
            )}
          </>
        )}
      </div>

      <div>
        {loadingTags ? (
          <div className="card" style={{ height: 360 }}>
            <div className="loading-wrap">加载中…</div>
          </div>
        ) : (
          <TopTagsChart data={topTags} title="Top 10 热门标签" height={340} />
        )}
      </div>
    </div>
  )
}

export default Dashboard
