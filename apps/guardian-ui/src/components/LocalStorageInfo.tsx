/**
 * Local Storage Info Component
 *
 * Comprehensive explanation of how data is stored locally,
 * with detailed instructions for prevention and clearing.
 *
 * @module components/LocalStorageInfo
 */

'use client';

import React, { useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import {
  IconDatabase,
  IconHardDrive,
  IconTrash,
  IconDownload,
  IconWarning,
  IconChevronDown,
  IconCheck,
  IconFolder,
  IconInfo,
} from '@/components/icons';

// =============================================================================
// Types
// =============================================================================

interface AccordionItemProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

// =============================================================================
// Accordion Item Component
// =============================================================================

function AccordionItem({ title, icon, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-[var(--color-steel-700)] rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[var(--color-steel-900)] hover:bg-[var(--color-steel-800)] transition-colors text-left"
        aria-expanded={isOpen}
      >
        <span className="text-[var(--color-copper-400)]">{icon}</span>
        <span className="flex-1 font-medium text-[var(--color-steel-200)]">{title}</span>
        <IconChevronDown
          size={18}
          className={`text-[var(--color-steel-400)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-[var(--color-steel-950)] text-[var(--color-steel-300)] text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Browser Step Component
// =============================================================================

interface BrowserStepProps {
  browser: string;
  icon: string;
  steps: string;
}

function BrowserStep({ browser, icon, steps }: BrowserStepProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-steel-900)] border border-[var(--color-steel-800)]">
      <span className="text-lg">{icon}</span>
      <div>
        <div className="font-medium text-[var(--color-steel-200)] mb-1">{browser}</div>
        <div className="text-xs text-[var(--color-steel-400)]">{steps}</div>
      </div>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function LocalStorageInfo() {
  const { t } = useTranslation();

  return (
    <section className="max-w-3xl mx-auto py-12 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-copper-500)]/10 border border-[var(--color-copper-500)]/30 mb-4">
          <IconDatabase size={32} className="text-[var(--color-copper-400)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--color-steel-100)] mb-2 font-[family-name:var(--font-space-grotesk)]">
          {t('storage.title')}
        </h2>
        <p className="text-[var(--color-steel-400)]">
          {t('storage.subtitle')}
        </p>
      </div>

      {/* Critical Warning */}
      <div className="mb-6 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
        <div className="flex items-start gap-3">
          <IconWarning size={24} className="text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-yellow-400 mb-1">{t('storage.warning.title')}</h3>
            <p className="text-yellow-200/80 text-sm">
              {t('storage.warning.text')}
            </p>
          </div>
        </div>
      </div>

      {/* Intro */}
      <p className="text-[var(--color-steel-300)] mb-6 leading-relaxed">
        {t('storage.intro')}
      </p>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {/* What is Stored */}
        <AccordionItem
          title={t('storage.whatStored.title')}
          icon={<IconFolder size={20} />}
          defaultOpen={true}
        >
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <IconCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{t('storage.whatStored.settings')}</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{t('storage.whatStored.profiles')}</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{t('storage.whatStored.history')}</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{t('storage.whatStored.calibration')}</span>
            </li>
            <li className="flex items-start gap-2">
              <IconCheck size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{t('storage.whatStored.ui')}</span>
            </li>
          </ul>
        </AccordionItem>

        {/* Where Data is Stored */}
        <AccordionItem
          title={t('storage.whereStored.title')}
          icon={<IconHardDrive size={20} />}
        >
          <p className="mb-4">{t('storage.whereStored.text')}</p>
          
          <div className="grid gap-2">
            <BrowserStep 
              browser="Chrome" 
              icon="🌐" 
              steps={t('storage.whereStored.browsers.chrome')} 
            />
            <BrowserStep 
              browser="Firefox" 
              icon="🦊" 
              steps={t('storage.whereStored.browsers.firefox')} 
            />
            <BrowserStep 
              browser="Safari" 
              icon="🧭" 
              steps={t('storage.whereStored.browsers.safari')} 
            />
            <BrowserStep 
              browser="Edge" 
              icon="🔵" 
              steps={t('storage.whereStored.browsers.edge')} 
            />
          </div>
        </AccordionItem>

        {/* How to Prevent Data Loss */}
        <AccordionItem
          title={t('storage.prevent.title')}
          icon={<IconDownload size={20} />}
        >
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <h4 className="font-semibold text-emerald-400 mb-1">{t('storage.prevent.step1.title')}</h4>
              <p className="text-emerald-200/80 text-sm">{t('storage.prevent.step1.text')}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-[var(--color-steel-900)] border border-[var(--color-steel-700)]">
              <h4 className="font-semibold text-[var(--color-steel-200)] mb-1">{t('storage.prevent.step2.title')}</h4>
              <p className="text-[var(--color-steel-400)] text-sm">{t('storage.prevent.step2.text')}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-[var(--color-steel-900)] border border-[var(--color-steel-700)]">
              <h4 className="font-semibold text-[var(--color-steel-200)] mb-1">{t('storage.prevent.step3.title')}</h4>
              <p className="text-[var(--color-steel-400)] text-sm">{t('storage.prevent.step3.text')}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-[var(--color-steel-900)] border border-[var(--color-steel-700)]">
              <h4 className="font-semibold text-[var(--color-steel-200)] mb-1">{t('storage.prevent.step4.title')}</h4>
              <p className="text-[var(--color-steel-400)] text-sm">{t('storage.prevent.step4.text')}</p>
            </div>
          </div>
        </AccordionItem>

        {/* How to Clear Data */}
        <AccordionItem
          title={t('storage.clear.title')}
          icon={<IconTrash size={20} />}
        >
          <p className="mb-4">{t('storage.clear.intro')}</p>
          
          <div className="space-y-4 mb-4">
            <div className="p-3 rounded-lg bg-[var(--color-copper-500)]/10 border border-[var(--color-copper-500)]/30">
              <h4 className="font-semibold text-[var(--color-copper-400)] mb-1">{t('storage.clear.option1.title')}</h4>
              <p className="text-[var(--color-copper-200)]/80 text-sm">{t('storage.clear.option1.text')}</p>
            </div>
            
            <div className="p-3 rounded-lg bg-[var(--color-steel-900)] border border-[var(--color-steel-700)]">
              <h4 className="font-semibold text-[var(--color-steel-200)] mb-1">{t('storage.clear.option2.title')}</h4>
              <p className="text-[var(--color-steel-400)] text-sm">{t('storage.clear.option2.text')}</p>
            </div>
          </div>

          <h4 className="font-medium text-[var(--color-steel-200)] mb-2">Browser-Specific Steps:</h4>
          <div className="grid gap-2">
            <BrowserStep 
              browser="Chrome" 
              icon="🌐" 
              steps={t('storage.clear.steps.chrome')} 
            />
            <BrowserStep 
              browser="Firefox" 
              icon="🦊" 
              steps={t('storage.clear.steps.firefox')} 
            />
            <BrowserStep 
              browser="Safari" 
              icon="🧭" 
              steps={t('storage.clear.steps.safari')} 
            />
            <BrowserStep 
              browser="Edge" 
              icon="🔵" 
              steps={t('storage.clear.steps.edge')} 
            />
          </div>
        </AccordionItem>

        {/* Data Recovery */}
        <AccordionItem
          title={t('storage.recovery.title')}
          icon={<IconInfo size={20} />}
        >
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-red-200/80">
              {t('storage.recovery.text')}
            </p>
          </div>
        </AccordionItem>
      </div>
    </section>
  );
}

export default LocalStorageInfo;

