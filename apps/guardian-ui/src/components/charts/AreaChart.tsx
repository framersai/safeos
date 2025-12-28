/**
 * Area Chart Component
 *
 * Recharts-based area chart for time series data.
 *
 * @module components/charts/AreaChart
 */

'use client';

import React from 'react';
import {
  AreaChart as RechartsAreaChart,
  Area,
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

export interface AreaChartProps {
  data: Record<string, unknown>[];
  dataKeys: {
    key: string;
    name: string;
    color: string;
    fillOpacity?: number;
  }[];
  xAxisKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  gradientFill?: boolean;
}

// =============================================================================
// Component
// =============================================================================

export function AreaChart({
  data,
  dataKeys,
  xAxisKey,
  height = 300,
  showGrid = true,
  showLegend = true,
  gradientFill = true,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsAreaChart
        data={data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        {/* Gradient Definitions */}
        <defs>
          {dataKeys.map((dk) => (
            <linearGradient key={dk.key} id={`gradient-${dk.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={dk.color} stopOpacity={0.8} />
              <stop offset="95%" stopColor={dk.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

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

        {dataKeys.map((dk) => (
          <Area
            key={dk.key}
            type="monotone"
            dataKey={dk.key}
            name={dk.name}
            stroke={dk.color}
            fill={gradientFill ? `url(#gradient-${dk.key})` : dk.color}
            fillOpacity={dk.fillOpacity ?? 1}
            strokeWidth={2}
          />
        ))}
      </RechartsAreaChart>
    </ResponsiveContainer>
  );
}

export default AreaChart;







