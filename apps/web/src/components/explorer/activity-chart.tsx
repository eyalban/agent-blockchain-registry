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
 * Picks a time-bucket size (in ms) such that the full range produces
 * roughly 12–30 bars. Always snaps to a "round" interval so x-axis
 * labels read cleanly.
 */
function pickBucketMs(spanMs: number): number {
  const candidates = [
    60_000,              // 1m
    5 * 60_000,          // 5m
    15 * 60_000,         // 15m
    30 * 60_000,         // 30m
    60 * 60_000,         // 1h
    6 * 60 * 60_000,     // 6h
    24 * 60 * 60_000,    // 1d
    7 * 24 * 60 * 60_000, // 1w
    30 * 24 * 60 * 60_000, // 1mo
  ]
  const targetBuckets = 20
  for (const ms of candidates) {
    if (spanMs / ms <= targetBuckets) return ms
  }
  return candidates[candidates.length - 1]!
}

/** Snap a timestamp down to the start of its bucket. */
function floorToBucket(ts: number, bucketMs: number): number {
  return Math.floor(ts / bucketMs) * bucketMs
}

function formatBucketLabel(ts: number, bucketMs: number): string {
  const d = new Date(ts)
  if (bucketMs < 24 * 60 * 60_000) {
    return d.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  }
  if (bucketMs < 7 * 24 * 60 * 60_000) {
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }
  return d.toLocaleDateString([], {
    year: '2-digit',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Bar chart of transaction activity over time. Events with a
 * `timestamp` field (unix ms) are bucketed by time; events without
 * one fall back to block-range bucketing so pre-existing callers keep
 * working.
 */
export function ActivityChart({ events }: ActivityChartProps) {
  if (events.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-(--color-border) bg-(--color-bg-secondary)">
        <p className="text-sm text-(--color-text-muted)">No activity data yet</p>
      </div>
    )
  }

  const timestamps = events
    .map((e) => e.timestamp)
    .filter((t): t is number => typeof t === 'number' && Number.isFinite(t))

  // Time-bucketed path (preferred).
  if (timestamps.length > 0) {
    const minTs = Math.min(...timestamps)
    const maxTs = Math.max(...timestamps)
    const span = Math.max(60_000, maxTs - minTs)
    const bucketMs = pickBucketMs(span)

    const counts = new Map<number, number>()
    for (const ts of timestamps) {
      const bucket = floorToBucket(ts, bucketMs)
      counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
    }

    // Fill in empty buckets so the chart shows the full time range.
    const firstBucket = floorToBucket(minTs, bucketMs)
    const lastBucket = floorToBucket(maxTs, bucketMs)
    const data: { time: string; count: number; _ts: number }[] = []
    for (let t = firstBucket; t <= lastBucket; t += bucketMs) {
      data.push({
        time: formatBucketLabel(t, bucketMs),
        count: counts.get(t) ?? 0,
        _ts: t,
      })
    }

    return (
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" vertical={false} />
          <XAxis
            dataKey="time"
            tick={{ fill: '#475569', fontSize: 10, fontFamily: 'monospace' }}
            axisLine={{ stroke: '#1a2235' }}
            tickLine={false}
            minTickGap={20}
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
            labelFormatter={(_, payload) => {
              const ts = payload?.[0]?.payload?._ts as number | undefined
              if (typeof ts !== 'number') return ''
              return new Date(ts).toLocaleString()
            }}
            formatter={(value) => [String(value), 'txs']}
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

  // ─── Fallback: block-range bucketing for events without timestamps ──
  const bucketSize = 500n
  const buckets = new Map<string, number>()
  for (const event of events) {
    const bucket = (event.blockNumber / bucketSize) * bucketSize
    const key = bucket.toString()
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }
  const data = [...buckets].map(([block, count]) => ({
    time: `#${block}`,
    count,
  }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1a2235" vertical={false} />
        <XAxis
          dataKey="time"
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
