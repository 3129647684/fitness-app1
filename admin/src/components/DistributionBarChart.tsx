import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { DistributionItem } from '@/types'
import { GREEN_COLORS } from './TrendLineChart'

interface DistributionBarChartProps {
  data: DistributionItem[]
  title: string
  height?: number
}

function DistributionBarChart({ data, title, height = 240 }: DistributionBarChartProps) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-title">{title}</div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" vertical={false} />
            <XAxis
              dataKey="range"
              tick={{ fontSize: 11, fill: '#6C757D' }}
              tickLine={false}
              axisLine={{ stroke: '#E9ECEF' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#6C757D' }}
              tickLine={false}
              axisLine={{ stroke: '#E9ECEF' }}
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
            <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={32}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={GREEN_COLORS[index % GREEN_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DistributionBarChart
