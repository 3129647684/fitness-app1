import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { TopTag } from '@/types'
import { GREEN_COLORS } from './TrendLineChart'

interface TopTagsChartProps {
  data: TopTag[]
  title?: string
  height?: number
}

function TopTagsChart({ data, title, height = 320 }: TopTagsChartProps) {
  const sorted = [...data].sort((a, b) => b.count - a.count)

  return (
    <div className="card" style={{ marginBottom: 0 }}>
      {title && <div className="card-title">{title}</div>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={sorted}
            layout="vertical"
            margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" horizontal={true} vertical={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#6C757D' }}
              tickLine={false}
              axisLine={{ stroke: '#E9ECEF' }}
            />
            <YAxis
              type="category"
              dataKey="tag"
              width={80}
              tick={{ fontSize: 12, fill: '#1B4332' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E9ECEF',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: 13,
              }}
              cursor={{ fill: 'rgba(64, 145, 108, 0.06)' }}
            />
            <Bar
              dataKey="count"
              fill={GREEN_COLORS[1]}
              radius={[0, 6, 6, 0]}
              barSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TopTagsChart
