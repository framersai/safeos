/**
 * Webhooks Management Page
 *
 * Configure custom webhook integrations.
 *
 * @module app/webhooks/page
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../stores/auth-store';
import { useToast } from '../../components/Toast';
import { ConfirmDialog } from '../../components/ConfirmDialog';

// =============================================================================
// Types
// =============================================================================

interface Webhook {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  isActive: boolean;
  lastTriggered: string | null;
  failureCount: number;
}

const AVAILABLE_EVENTS = [
  { id: 'alert.created', label: 'Alert Created', description: 'When a new alert is generated' },
  { id: 'alert.acknowledged', label: 'Alert Acknowledged', description: 'When an alert is acknowledged' },
  { id: 'stream.started', label: 'Stream Started', description: 'When a monitoring stream starts' },
  { id: 'stream.ended', label: 'Stream Ended', description: 'When a monitoring stream ends' },
  { id: 'analysis.completed', label: 'Analysis Completed', description: 'When AI analysis finishes' },
  { id: 'review.required', label: 'Review Required', description: 'When human review is needed' },
];

// =============================================================================
// Component
// =============================================================================

export default function WebhooksPage() {
  const { sessionToken, isAuthenticated, isInitialized } = useAuthStore();
  const { success, error: showError, info } = useToast();
  
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  // Form state
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: [] as string[],
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    if (isAuthenticated) {
      fetchWebhooks();
    }
  }, [isAuthenticated]);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/webhooks`, {
        headers: { 'X-Session-Token': sessionToken || '' },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.data || []);
      }
    } catch (err) {
      showError('Failed to load webhooks');
    } finally {
      setIsLoading(false);
    }
  };

  const createWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newWebhook.name || !newWebhook.url || newWebhook.events.length === 0) {
      showError('Please fill in all required fields');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/webhooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Token': sessionToken || '',
        },
        body: JSON.stringify(newWebhook),
      });

      if (res.ok) {
        const data = await res.json();
        setWebhooks([...webhooks, data.data]);
        setNewWebhook({ name: '', url: '', events: [] });
        setIsCreating(false);
        success('Webhook created!', `Secret: ${data.data.secret}`);
      } else {
        const err = await res.json();
        showError(err.error || 'Failed to create webhook');
      }
    } catch (err) {
      showError('Failed to create webhook');
    }
  };

  const deleteWebhook = async () => {
    if (!deleteId) return;

    try {
      const res = await fetch(`${API_URL}/api/webhooks/${deleteId}`, {
        method: 'DELETE',
        headers: { 'X-Session-Token': sessionToken || '' },
      });

      if (res.ok) {
        setWebhooks(webhooks.filter((w) => w.id !== deleteId));
        success('Webhook deleted');
      } else {
        showError('Failed to delete webhook');
      }
    } catch (err) {
      showError('Failed to delete webhook');
    } finally {
      setDeleteId(null);
    }
  };

  const testWebhook = async (id: string) => {
    try {
      info('Sending test payload...');
      const res = await fetch(`${API_URL}/api/webhooks/${id}/test`, {
        method: 'POST',
        headers: { 'X-Session-Token': sessionToken || '' },
      });

      if (res.ok) {
        success('Test webhook sent successfully!');
      } else {
        const err = await res.json();
        showError(err.error || 'Test failed');
      }
    } catch (err) {
      showError('Failed to send test');
    }
  };

  const toggleEvent = (eventId: string) => {
    setNewWebhook((prev) => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter((e) => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please log in</h1>
          <Link href="/" className="text-emerald-400 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-700/50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/settings" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-white">Webhooks</h1>
              <p className="text-xs text-slate-400">Custom integrations & notifications</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreating(true)}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            + New Webhook
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-slate-600 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : webhooks.length === 0 && !isCreating ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-800 flex items-center justify-center">
              <span className="text-3xl">🔗</span>
            </div>
            <h2 className="text-xl font-semibold text-white mb-2">No webhooks configured</h2>
            <p className="text-slate-400 mb-6">
              Set up webhooks to receive real-time notifications when events occur.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Create your first webhook
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Create Form */}
            {isCreating && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Create New Webhook</h2>
                <form onSubmit={createWebhook} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                    <input
                      type="text"
                      value={newWebhook.name}
                      onChange={(e) => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      placeholder="My Integration"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Webhook URL</label>
                    <input
                      type="url"
                      value={newWebhook.url}
                      onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      placeholder="https://your-app.com/webhook"
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Events to Subscribe</label>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {AVAILABLE_EVENTS.map((event) => (
                        <label
                          key={event.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            newWebhook.events.includes(event.id)
                              ? 'bg-emerald-500/20 border-emerald-500/50'
                              : 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={newWebhook.events.includes(event.id)}
                            onChange={() => toggleEvent(event.id)}
                            className="mt-1 h-4 w-4 text-emerald-600 bg-slate-700 border-slate-600 rounded"
                          />
                          <div>
                            <p className="text-sm font-medium text-white">{event.label}</p>
                            <p className="text-xs text-slate-400">{event.description}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                    >
                      Create Webhook
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Webhook List */}
            {webhooks.map((webhook) => (
              <div
                key={webhook.id}
                className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{webhook.name}</h3>
                    <p className="text-sm text-slate-400 break-all">{webhook.url}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {webhook.isActive ? (
                      <span className="px-2 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded">Active</span>
                    ) : (
                      <span className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded">Inactive</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {webhook.events.map((event) => (
                    <span key={event} className="px-2 py-1 text-xs bg-slate-700 text-slate-300 rounded">
                      {event}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                  <div className="text-sm text-slate-500">
                    {webhook.lastTriggered
                      ? `Last triggered: ${new Date(webhook.lastTriggered).toLocaleDateString()}`
                      : 'Never triggered'}
                    {webhook.failureCount > 0 && (
                      <span className="ml-2 text-orange-400">({webhook.failureCount} failures)</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => testWebhook(webhook.id)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => setDeleteId(webhook.id)}
                      className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={deleteWebhook}
        title="Delete Webhook"
        message="Are you sure you want to delete this webhook? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}







