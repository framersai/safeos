'use client';

/**
 * About Page
 * 
 * Mission statement, project info, and contact details.
 * 
 * @module app/about/page
 */

import Link from 'next/link';
import {
  IconChevronLeft,
  IconShield,
  IconHeart,
  IconGlobe,
  IconDatabase,
} from '../../components/icons';

// =============================================================================
// Components
// =============================================================================

function ValueCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="p-6 bg-slate-800/50 border border-slate-700 rounded-xl">
      <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
        {icon}
      </div>
      <h3 className="font-semibold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  );
}

function TeamMember({
  name,
  role,
  avatar,
}: {
  name: string;
  role: string;
  avatar: string;
}) {
  return (
    <div className="text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 mx-auto mb-3 flex items-center justify-center text-3xl">
        {avatar}
      </div>
      <h4 className="font-medium text-white">{name}</h4>
      <p className="text-sm text-slate-400">{role}</p>
    </div>
  );
}

// =============================================================================
// Main Page
// =============================================================================

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-slate-400 hover:text-white"
              >
                <IconChevronLeft size={20} />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛡️</span>
                <h1 className="text-xl font-bold text-white">About SafeOS</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 flex items-center justify-center">
              <IconShield size={48} className="text-emerald-400" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4">
            SafeOS Guardian
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            A humanitarian tool for protecting what matters most—your loved ones, pets, and home.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-16">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">01</span>
            Our Mission
          </h3>
          <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl">
            <p className="text-slate-300 leading-relaxed mb-4">
              SafeOS Guardian was created with a singular purpose: to provide accessible, privacy-respecting
              monitoring tools for families worldwide. We believe everyone deserves peace of mind when it
              comes to the safety of their loved ones.
            </p>
            <p className="text-slate-300 leading-relaxed mb-4">
              Unlike cloud-based solutions that store your data on remote servers, SafeOS runs entirely
              in your browser. Your recordings, settings, and personal information never leave your device.
              This local-first approach ensures maximum privacy while delivering powerful monitoring capabilities.
            </p>
            <p className="text-slate-400 leading-relaxed">
              <strong className="text-emerald-400">Important:</strong> SafeOS Guardian is a supplemental,
              experimental tool for educated parents and caregivers. It is not a replacement for human
              supervision. Always maintain direct oversight of those in your care.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="mb-16">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <span className="text-emerald-400">02</span>
            Our Values
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ValueCard
              icon={<IconDatabase size={24} />}
              title="Privacy First"
              description="All data stays on your device. We never collect, store, or sell your personal information. Your privacy is non-negotiable."
            />
            <ValueCard
              icon={<IconShield size={24} />}
              title="Open & Transparent"
              description="Our code is open source. Anyone can inspect, audit, and contribute to the project. Transparency builds trust."
            />
            <ValueCard
              icon={<IconHeart size={24} />}
              title="Humanitarian Purpose"
              description="SafeOS is built for families, not profit. We're committed to keeping essential features free for everyone."
            />
            <ValueCard
              icon={<IconGlobe size={24} />}
              title="Accessible Globally"
              description="Multi-language support and offline capabilities ensure SafeOS works for families everywhere, regardless of internet access."
            />
          </div>
        </section>

        {/* 10% for Humanity */}
        <section className="mb-16">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">03</span>
            10% for Humanity
          </h3>
          <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <IconHeart size={24} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white">Giving Back</h4>
                <p className="text-sm text-slate-400">A commitment to humanitarian causes</p>
              </div>
            </div>
            <p className="text-slate-300 leading-relaxed mb-4">
              If SafeOS ever generates revenue (through optional donations or premium features),
              we pledge to donate 10% of all proceeds to humanitarian organizations focused on
              child safety, missing persons recovery, and family welfare.
            </p>
            <p className="text-sm text-slate-400">
              This commitment is permanent and will never change. We believe technology should
              serve humanity, not exploit it.
            </p>
          </div>
        </section>

        {/* Technology */}
        <section className="mb-16">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">04</span>
            Technology
          </h3>
          <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl">
            <p className="text-slate-300 leading-relaxed mb-4">
              SafeOS Guardian is built with modern web technologies:
            </p>
            <ul className="space-y-2 text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span><strong className="text-white">Next.js & React</strong> — Fast, responsive user interface</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span><strong className="text-white">TensorFlow.js</strong> — AI detection running in your browser</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span><strong className="text-white">IndexedDB</strong> — Local-first data storage</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span><strong className="text-white">Web Audio API</strong> — Real-time audio analysis</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 mt-1">•</span>
                <span><strong className="text-white">MediaDevices API</strong> — Camera and microphone access</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Abuse Policy */}
        <section className="mb-16">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">05</span>
            Abuse Prevention
          </h3>
          <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-slate-300 leading-relaxed mb-4">
              SafeOS Guardian is designed for legitimate monitoring purposes only. We actively discourage
              and track potential abuse of this technology:
            </p>
            <ul className="space-y-2 text-slate-400 mb-4">
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">⚠</span>
                <span>Surveillance without consent is illegal in most jurisdictions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">⚠</span>
                <span>Rate limitations and warnings are implemented to prevent misuse</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400 mt-1">⚠</span>
                <span>We reserve the right to take down the service if abuse is detected</span>
              </li>
            </ul>
            <p className="text-sm text-slate-500">
              Use SafeOS responsibly. Monitor only those you have legal authority to monitor,
              and always respect privacy laws in your jurisdiction.
            </p>
          </div>
        </section>

        {/* Contact */}
        <section className="mb-16">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <span className="text-emerald-400">06</span>
            Contact
          </h3>
          <div className="p-6 bg-slate-900 border border-slate-700 rounded-xl">
            <p className="text-slate-300 leading-relaxed mb-4">
              Have questions, feedback, or want to contribute? We&apos;d love to hear from you.
            </p>
            <div className="space-y-2">
              <p className="text-slate-400">
                <strong className="text-white">GitHub:</strong>{' '}
                <a
                  href="https://github.com/super-cloud-mcps/safeos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  github.com/super-cloud-mcps/safeos
                </a>
              </p>
              <p className="text-slate-400">
                <strong className="text-white">Email:</strong>{' '}
                <a
                  href="mailto:safeos@example.com"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  safeos@example.com
                </a>
              </p>
            </div>
          </div>
        </section>

        {/* Forever Free */}
        <section className="text-center">
          <div className="inline-block p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-2xl">
            <p className="text-lg font-medium text-white mb-2">
              SafeOS Guardian will always be free.
            </p>
            <p className="text-sm text-slate-400">
              No subscriptions. No hidden fees. No data selling. Ever.
            </p>
          </div>
        </section>

        {/* Links */}
        <div className="mt-12 flex justify-center gap-4">
          <Link
            href="/tutorials"
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            View Tutorials
          </Link>
          <Link
            href="/donate"
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            Support Us
          </Link>
        </div>
      </main>
    </div>
  );
}






