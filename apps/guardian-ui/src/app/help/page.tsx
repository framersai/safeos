/**
 * Help & FAQ Page
 *
 * Help documentation and frequently asked questions.
 *
 * @module app/help/page
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShortcutList } from '../../hooks/useKeyboardShortcuts';

// =============================================================================
// Types
// =============================================================================

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface HelpSection {
  id: string;
  title: string;
  icon: string;
}

// =============================================================================
// Data
// =============================================================================

const faqs: FAQItem[] = [
  {
    category: 'general',
    question: 'What is SafeOS Guardian?',
    answer: 'SafeOS Guardian is a free, AI-powered monitoring service for pets, babies, and elderly care. It uses your device\'s camera and microphone to detect potential issues and alert you in real-time. It\'s part of SuperCloud\'s 10% for Humanity initiative.',
  },
  {
    category: 'general',
    question: 'Is SafeOS free?',
    answer: 'Yes! SafeOS is completely free to use. We believe everyone deserves access to safety monitoring tools. The service is funded through SuperCloud\'s humanitarian commitment.',
  },
  {
    category: 'general',
    question: 'Can SafeOS replace professional care?',
    answer: 'No. SafeOS is a SUPPLEMENTARY tool only. It should never replace direct human care, professional medical monitoring, or parental supervision. Always ensure proper care is provided.',
  },
  {
    category: 'privacy',
    question: 'What happens to my video data?',
    answer: 'Video processing happens locally on your device. Frames are only kept for 5-10 minutes in a rolling buffer and are automatically deleted. Only AI-analyzed results (not raw video) may be stored temporarily for alert purposes.',
  },
  {
    category: 'privacy',
    question: 'Do you store my data on servers?',
    answer: 'Most data is stored locally in your browser using IndexedDB. Server-side storage is minimal and focused on alerts and session management. No video is stored on servers unless flagged for human review (and even then, it\'s anonymized).',
  },
  {
    category: 'privacy',
    question: 'How does human review work?',
    answer: 'In rare cases where the AI flags concerning content, a human reviewer may review anonymized snapshots. Personal identifying information is blurred or removed before review.',
  },
  {
    category: 'technical',
    question: 'What browsers are supported?',
    answer: 'SafeOS works best in modern browsers like Chrome, Firefox, Safari, and Edge. The browser must support WebRTC and IndexedDB for full functionality.',
  },
  {
    category: 'technical',
    question: 'Why does it need camera/microphone access?',
    answer: 'Camera access is needed to monitor visual activity. Microphone access is optional but enables audio detection (like crying or calls for help). All processing happens locally.',
  },
  {
    category: 'technical',
    question: 'How does the AI work?',
    answer: 'We use local AI models (via Ollama) for privacy-first analysis. A fast "triage" model scans frames, and a more detailed model analyzes anything flagged as potentially concerning. Cloud AI is only used as a fallback when local processing fails.',
  },
  {
    category: 'alerts',
    question: 'Why are my alerts getting louder?',
    answer: 'Unacknowledged alerts automatically escalate in volume over time. This is a safety feature to ensure critical alerts are noticed. Simply acknowledge the alert to stop escalation.',
  },
  {
    category: 'alerts',
    question: 'Can I get alerts when away from my computer?',
    answer: 'Yes! Enable browser push notifications, or connect SMS (via Twilio) or Telegram for remote alerts. Configure these in Settings > Notifications.',
  },
  {
    category: 'alerts',
    question: 'Too many false alerts - what should I do?',
    answer: 'Adjust motion and audio sensitivity in Settings > Detection. Higher sensitivity values mean fewer alerts. You can also try repositioning your camera to reduce background movement.',
  },
];

const sections: HelpSection[] = [
  { id: 'getting-started', title: 'Getting Started', icon: '🚀' },
  { id: 'faq', title: 'FAQ', icon: '❓' },
  { id: 'shortcuts', title: 'Keyboard Shortcuts', icon: '⌨️' },
  { id: 'troubleshooting', title: 'Troubleshooting', icon: '🔧' },
  { id: 'contact', title: 'Contact Support', icon: '💬' },
];

// =============================================================================
// Component
// =============================================================================

export default function HelpPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [faqCategory, setFaqCategory] = useState<string>('all');

  const filteredFaqs = faqCategory === 'all' 
    ? faqs 
    : faqs.filter((f) => f.category === faqCategory);

  const categories = ['all', ...Array.from(new Set(faqs.map((f) => f.category)))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="p-4 sm:p-6 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-white">Help & FAQ</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <nav className="md:w-56 flex-shrink-0">
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-slate-700 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content */}
          <main className="flex-1">
            {activeSection === 'getting-started' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">Getting Started with SafeOS</h2>
                  <p className="text-slate-300 mb-6">
                    Welcome to SafeOS Guardian! Follow these steps to set up your first monitoring session.
                  </p>

                  <div className="space-y-6">
                    {/* Step 1 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">Accept the Disclaimer</h3>
                        <p className="text-sm text-slate-400">
                          Read and accept our safety disclaimer. This is required to continue.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">Choose Your Profile</h3>
                        <p className="text-sm text-slate-400">
                          Select what you're monitoring: pets, babies, or elderly. Each profile has optimized settings.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">Allow Camera Access</h3>
                        <p className="text-sm text-slate-400">
                          Grant browser permission to access your camera (and optionally microphone).
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <h3 className="text-white font-medium mb-1">Start Monitoring</h3>
                        <p className="text-sm text-slate-400">
                          Click "Start Monitoring" and position your camera. The AI will begin analyzing!
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    <Link
                      href="/tutorial"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                    >
                      Start Interactive Tutorial
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>

                {/* Video Tutorial Embed */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">📺 Video Tutorial</h3>
                  <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl opacity-50">▶️</span>
                      <p className="text-slate-400 mt-2">Video tutorial coming soon</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'faq' && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
                <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
                  <select
                    value={faqCategory}
                    onChange={(e) => setFaqCategory(e.target.value)}
                    className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-white"
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="divide-y divide-slate-700/50">
                  {filteredFaqs.map((faq, index) => (
                    <div key={index}>
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="w-full p-4 text-left hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-medium pr-4">{faq.question}</h3>
                          <svg
                            className={`w-5 h-5 text-slate-400 transform transition-transform ${
                              expandedFaq === index ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>
                      {expandedFaq === index && (
                        <div className="px-4 pb-4">
                          <p className="text-slate-300">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'shortcuts' && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Keyboard Shortcuts</h2>
                <p className="text-slate-400 mb-6">
                  Use these keyboard shortcuts for faster navigation.
                </p>
                <ShortcutList />
              </div>
            )}

            {activeSection === 'troubleshooting' && (
              <div className="space-y-6">
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4">Common Issues</h2>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Camera not working</h3>
                      <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                        <li>Check that you've granted camera permissions</li>
                        <li>Make sure no other app is using the camera</li>
                        <li>Try refreshing the page</li>
                        <li>Check browser camera settings</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-white font-medium mb-2">AI analysis not running</h3>
                      <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                        <li>Ensure Ollama is running locally</li>
                        <li>Check that required models are installed</li>
                        <li>Verify network connection for cloud fallback</li>
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-700/30 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Notifications not appearing</h3>
                      <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
                        <li>Enable browser notifications in system settings</li>
                        <li>Check Settings → Notifications in SafeOS</li>
                        <li>Ensure you're not in Quiet Hours mode</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
                  <h3 className="text-amber-400 font-medium mb-2">Still having issues?</h3>
                  <p className="text-slate-300 text-sm">
                    If you're still experiencing problems, please reach out to our support team with
                    details about your browser, device, and the specific issue you're facing.
                  </p>
                </div>
              </div>
            )}

            {activeSection === 'contact' && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                <h2 className="text-lg font-semibold text-white mb-4">Contact Support</h2>
                <p className="text-slate-300 mb-6">
                  Need help? Reach out through any of these channels:
                </p>

                <div className="grid sm:grid-cols-2 gap-4">
                  <a
                    href="https://github.com/supercloud/safeos/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-2xl">🐛</span>
                    <h3 className="text-white font-medium mt-2">GitHub Issues</h3>
                    <p className="text-sm text-slate-400">Report bugs and request features</p>
                  </a>

                  <a
                    href="https://discord.gg/supercloud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-2xl">💬</span>
                    <h3 className="text-white font-medium mt-2">Discord Community</h3>
                    <p className="text-sm text-slate-400">Chat with other users</p>
                  </a>

                  <a
                    href="mailto:support@safeos.dev"
                    className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-2xl">📧</span>
                    <h3 className="text-white font-medium mt-2">Email Support</h3>
                    <p className="text-sm text-slate-400">support@safeos.dev</p>
                  </a>

                  <a
                    href="https://twitter.com/supercloud"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-4 bg-slate-700/30 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-2xl">𝕏</span>
                    <h3 className="text-white font-medium mt-2">Twitter/X</h3>
                    <p className="text-sm text-slate-400">@supercloud</p>
                  </a>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}







