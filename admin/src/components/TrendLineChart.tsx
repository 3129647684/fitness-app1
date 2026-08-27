import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { TrendPoint } from '@/types'

interface TrendLineChartProps {
  data: TrendPoint[]
  title?: string
  height?: number
  color?: string
}

const GREEN_COLORS = ['#2D6A4F', '#40916C', '#74C69D', '#52B788', '#95D5B2']

function TrendLineChart({ data, title, height = 300, color = GREEN_COLORS[1] }: TrendLineChartProps) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      {title && <div className="card-title">{title}</div>}
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E9ECEF" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#6C757D' }}
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
              labelStyle={{ color: '#1B4332', fontWeight: 600 }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default TrendLineChart
export { GREEN_COLORS }
