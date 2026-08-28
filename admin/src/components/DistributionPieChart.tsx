import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
} from 'recharts'
import type { DistributionItem } from '@/types'
import { GREEN_COLORS } from './TrendLineChart'

interface DistributionPieChartProps {
  data: DistributionItem[]
  title: string
  height?: number
  dataKey?: string
  nameKey?: string
}

function DistributionPieChart({
  data,
  title,
  height = 240,
  dataKey = 'count',
  nameKey = 'bucket',
}: DistributionPieChartProps) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="card-title">{title}</div>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={2}
              dataKey={dataKey}
              nameKey={nameKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={GREEN_COLORS[index % GREEN_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#fff',
                border: '1px solid #E9ECEF',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                fontSize: 13,
              }}
            />
            <Legend
              iconSize={10}
              wrapperStyle={{ fontSize: 12, color: '#6C757D' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default DistributionPieChart
