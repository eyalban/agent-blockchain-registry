'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

import type { RegistryEvent } from '@/hooks/use-recent-events'

interface ActivityChartProps {
  readonly events: readonly RegistryEvent[]
}

/**
 * Groups events by block ranges and renders a bar chart of registration activity.
 */
export function ActivityChart({ events }: ActivityChartProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-(--color-border) bg-(--color-bg-secondary)">
        <p className="text-sm text-(--color-text-muted)">No activity data yet</p>
      </div>
    )
  }

  // Group events into buckets by block ranges
  const bucketSize = 500n
  const data: { block: string; count: number }[] = []
  const buckets = new Map<string, number>()

  for (const event of events) {
    const bucket = (event.blockNumber / bucketSize) * bucketSize
    const key = bucket.toString()
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  for (const [block, count] of buckets) {
    data.push({ block: `#${block}`, count })
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" vertical={false} />
        <XAxis
          dataKey="block"
          tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={{ stroke: '#1a2235' }}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          cursor={{ fill: 'rgba(0, 229, 255, 0.05)' }}
          contentStyle={{
            background: '#0f1520',
            border: '1px solid #1a2235',
            borderRadius: '8px',
            color: '#e2e8f0',
            fontFamily: 'monospace',
            fontSize: '12px',
          }}
          wrapperStyle={{ outline: 'none' }}
          labelStyle={{ color: '#64748b' }}
        />
        <Bar
          dataKey="count"
          fill="url(#barGradient)"
          radius={[4, 4, 0, 0]}
          maxBarSize={40}
        />
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.8} />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.4} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  )
}
