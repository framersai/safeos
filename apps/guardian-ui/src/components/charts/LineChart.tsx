/**
 * Line Chart Component
 *
 * Recharts-based line chart for trend data.
 *
 * @module components/charts/LineChart
 */

'use client';

import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// =============================================================================
// Types
// =============================================================================

export interface LineChartProps {
  data: Record<string, unknown>[];
  lines: {
    key: string;
    name: string;
    color: string;
    strokeWidth?: number;
    dashed?: boolean;
  }[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  showDots?: boolean;
  curved?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function LineChart({
  data,
  lines,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  showDots = true,
  curved = true,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsLineChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        )}

        <XAxis
          dataKey={xAxisKey}
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
        />

        <YAxis
          stroke="#64748b"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: '#334155' }}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
          }}
          labelStyle={{ color: '#94a3b8' }}
        />

        {showLegend && (
          <Legend
            wrapperStyle={{ color: '#94a3b8' }}
          />
        )}

        {lines.map((line) => (
          <Line
            key={line.key}
            type={curved ? 'monotone' : 'linear'}
            dataKey={line.key}
            name={line.name}
            stroke={line.color}
            strokeWidth={line.strokeWidth || 2}
            strokeDasharray={line.dashed ? '5 5' : undefined}
            dot={showDots ? { fill: line.color, strokeWidth: 2 } : false}
            activeDot={{ r: 6, fill: line.color }}
          />
        ))}
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}

export default LineChart;







