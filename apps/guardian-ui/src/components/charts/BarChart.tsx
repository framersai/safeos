/**
 * Bar Chart Component
 *
 * Recharts-based bar chart for categorical data.
 *
 * @module components/charts/BarChart
 */

'use client';

import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';

// =============================================================================
// Types
// =============================================================================

export interface BarChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey: string;
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  horizontal?: boolean;
  colors?: string[];
  defaultColor?: string;
  barRadius?: number;
}

// =============================================================================
// Default Colors
// =============================================================================

const DEFAULT_COLORS = [
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f97316', // orange
  '#ef4444', // red
  '#eab308', // yellow
  '#3b82f6', // blue
  '#ec4899', // pink
];

// =============================================================================
// Component
// =============================================================================

export function BarChart({
  data,
  dataKey,
  nameKey,
  height = 300,
  showGrid = true,
  showLegend = false,
  horizontal = false,
  colors = DEFAULT_COLORS,
  defaultColor = '#10b981',
  barRadius = 4,
}: BarChartProps) {
  const Layout = horizontal ? (
    <RechartsBarChart
      layout="vertical"
      data={data}
      margin={{ top: 10, right: 30, left: 80, bottom: 0 }}
    >
      {showGrid && (
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
      )}

      <XAxis
        type="number"
        stroke="#64748b"
        fontSize={12}
        tickLine={false}
        axisLine={{ stroke: '#334155' }}
      />

      <YAxis
        type="category"
        dataKey={nameKey}
        stroke="#64748b"
        fontSize={12}
        tickLine={false}
        axisLine={{ stroke: '#334155' }}
        width={70}
      />

      <Tooltip
        contentStyle={{
          backgroundColor: '#1e293b',
          border: '1px solid #334155',
          borderRadius: '8px',
          color: '#f8fafc',
        }}
        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
      />

      {showLegend && <Legend />}

      <Bar
        dataKey={dataKey}
        radius={[0, barRadius, barRadius, 0]}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length] || defaultColor} />
        ))}
      </Bar>
    </RechartsBarChart>
  ) : (
    <RechartsBarChart
      data={data}
      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
    >
      {showGrid && (
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
      )}

      <XAxis
        dataKey={nameKey}
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
        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
      />

      {showLegend && <Legend />}

      <Bar
        dataKey={dataKey}
        radius={[barRadius, barRadius, 0, 0]}
      >
        {data.map((_, index) => (
          <Cell key={`cell-${index}`} fill={colors[index % colors.length] || defaultColor} />
        ))}
      </Bar>
    </RechartsBarChart>
  );

  return (
    <ResponsiveContainer width="100%" height={height}>
      {Layout}
    </ResponsiveContainer>
  );
}

export default BarChart;







