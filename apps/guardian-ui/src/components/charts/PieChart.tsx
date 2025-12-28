/**
 * Pie Chart Component
 *
 * Recharts-based pie/donut chart for distribution data.
 *
 * @module components/charts/PieChart
 */

'use client';

import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

// =============================================================================
// Types
// =============================================================================

export interface PieChartProps {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  showLegend?: boolean;
  donut?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  label?: boolean;
  labelLine?: boolean;
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

export function PieChart({
  data,
  height = 300,
  showLegend = true,
  donut = false,
  innerRadius = 60,
  outerRadius = 80,
  label = false,
  labelLine = false,
}: PieChartProps) {
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    name,
  }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
      <text
        x={x}
        y={y}
        fill="#94a3b8"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsPieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={donut ? innerRadius : 0}
          outerRadius={outerRadius}
          paddingAngle={donut ? 3 : 0}
          dataKey="value"
          label={label ? renderCustomLabel : undefined}
          labelLine={labelLine}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip
          contentStyle={{
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            color: '#f8fafc',
          }}
          formatter={(value: number) => [value, '']}
        />

        {showLegend && (
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ color: '#94a3b8', paddingTop: '20px' }}
          />
        )}
      </RechartsPieChart>
    </ResponsiveContainer>
  );
}

export default PieChart;







