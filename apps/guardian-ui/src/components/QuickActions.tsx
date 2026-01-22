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
  icon: React.ReactNode;
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
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M23 7l-7 5 7 5V7z" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      ),
      href: '/monitor',
      color: 'from-emerald-500 to-cyan-500',
    },
    {
      id: 'setup',
      label: 'Setup Wizard',
      description: 'Configure monitoring profile',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      ),
      href: '/setup',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'history',
      label: 'Alert History',
      description: 'View past alerts & events',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      href: '/history',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      id: 'settings',
      label: 'Settings',
      description: 'Notifications & preferences',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      ),
      href: '/settings',
      color: 'from-orange-500 to-amber-500',
    },
  ];

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
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
      aria-label={action.label}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform text-white`}
      >
        {action.icon}
      </div>

      {/* Content */}
      <h4 className="font-medium text-white text-sm mb-1">{action.label}</h4>
      <p className="text-xs text-slate-400 line-clamp-2">{action.description}</p>

      {/* Arrow indicator */}
      <div className="absolute top-4 right-4 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default QuickActions;




































