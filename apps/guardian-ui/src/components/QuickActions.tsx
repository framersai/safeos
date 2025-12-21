/**
 * Quick Actions Component
 *
 * Quick action buttons for common operations.
 *
 * @module components/QuickActions
 */

'use client';

import Link from 'next/link';
import { useMonitoringStore } from '../stores/monitoring-store';

// =============================================================================
// Types
// =============================================================================

interface QuickAction {
  id: string;
  label: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  disabled?: boolean;
}

// =============================================================================
// QuickActions Component
// =============================================================================

export function QuickActions() {
  const { isStreaming } = useMonitoringStore();

  const actions: QuickAction[] = [
    {
      id: 'monitor',
      label: isStreaming ? 'View Monitor' : 'Start Monitoring',
      description: isStreaming
        ? 'Go to active stream'
        : 'Begin camera monitoring',
      icon: '📹',
      href: '/monitor',
      color: 'from-emerald-500 to-cyan-500',
    },
    {
      id: 'setup',
      label: 'Setup Wizard',
      description: 'Configure monitoring profile',
      icon: '⚙️',
      href: '/setup',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'history',
      label: 'Alert History',
      description: 'View past alerts & events',
      icon: '📊',
      href: '/history',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Notifications & preferences',
      icon: '🔧',
      href: '/settings',
      color: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <span>⚡</span>
          Quick Actions
        </h3>
      </div>

      {/* Actions Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {actions.map((action) => (
            <ActionCard key={action.id} action={action} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Sub-components
// =============================================================================

interface ActionCardProps {
  action: QuickAction;
}

function ActionCard({ action }: ActionCardProps) {
  return (
    <Link
      href={action.href}
      className={`group relative p-4 rounded-xl border border-slate-700/50 transition-all hover:border-slate-600 hover:bg-slate-700/30 ${
        action.disabled ? 'opacity-50 pointer-events-none' : ''
      }`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
      >
        <span className="text-xl">{action.icon}</span>
      </div>

      {/* Content */}
      <h4 className="font-medium text-white text-sm mb-1">{action.label}</h4>
      <p className="text-xs text-slate-400 line-clamp-2">{action.description}</p>

      {/* Arrow indicator */}
      <div className="absolute top-4 right-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
        →
      </div>
    </Link>
  );
}

export default QuickActions;








