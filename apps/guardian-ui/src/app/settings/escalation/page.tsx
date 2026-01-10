/**
 * Alert Escalation Settings Page
 *
 * Configure alert escalation timing, per-severity sounds, and test escalation flow.
 *
 * @module app/settings/escalation/page
 */

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSettingsStore } from '../../../stores/settings-store';
import { useSoundManager, SoundType } from '../../../lib/sound-manager';

// =============================================================================
// Types
// =============================================================================

interface EscalationLevel {
    level: number;
    name: string;
    description: string;
    volumeMultiplier: number;
    delaySeconds: number;
    soundType: SoundType;
}

const DEFAULT_ESCALATION_LEVELS: EscalationLevel[] = [
    {
        level: 1,
        name: 'Gentle Reminder',
        description: 'Soft notification sound at set volume',
        volumeMultiplier: 1.0,
        delaySeconds: 0,
        soundType: 'notification',
    },
    {
        level: 2,
        name: 'Attention',
        description: 'Louder alert, repeated twice',
        volumeMultiplier: 1.3,
        delaySeconds: 30,
        soundType: 'alert',
    },
    {
        level: 3,
        name: 'Urgent',
        description: 'Warning sound at increased volume',
        volumeMultiplier: 1.5,
        delaySeconds: 60,
        soundType: 'warning',
    },
    {
        level: 4,
        name: 'Critical',
        description: 'Alarm sound at near-max volume',
        volumeMultiplier: 1.8,
        delaySeconds: 120,
        soundType: 'alarm',
    },
    {
        level: 5,
        name: 'Emergency',
        description: 'Maximum volume, continuous until acknowledged',
        volumeMultiplier: 2.0,
        delaySeconds: 180,
        soundType: 'emergency',
    },
];

// =============================================================================
// Escalation Settings Page
// =============================================================================

export default function EscalationSettingsPage() {
    const [mounted, setMounted] = useState(false);
    const [escalationLevels, setEscalationLevels] = useState(DEFAULT_ESCALATION_LEVELS);
    const [testingLevel, setTestingLevel] = useState<number | null>(null);

    const { globalSettings, timingSettings, updateTimingSettings, updateGlobalSettings, severityCooldowns, updateSeverityCooldowns } = useSettingsStore();
    const soundManager = useSoundManager();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    const testEscalationLevel = (level: EscalationLevel) => {
        setTestingLevel(level.level);
        const volume = Math.min(1, (globalSettings.alertVolume / 100) * level.volumeMultiplier);
        soundManager.updateVolume(volume);
        soundManager.test(level.soundType);
        setTimeout(() => {
            setTestingLevel(null);
            soundManager.updateVolume(globalSettings.alertVolume / 100);
        }, 1500);
    };

    const updateLevelDelay = (levelIndex: number, newDelay: number) => {
        setEscalationLevels(prev => {
            const updated = [...prev];
            updated[levelIndex] = { ...updated[levelIndex], delaySeconds: newDelay };
            return updated;
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="p-4 sm:p-6 border-b border-slate-700/50">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/settings" className="text-slate-400 hover:text-white transition-colors" aria-label="Go back to settings">
                            <ChevronLeftIcon aria-hidden="true" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-white">Alert Escalation</h1>
                            <p className="text-sm text-slate-400">
                                Configure how alerts increase in urgency over time
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">

                {/* How It Works */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-amber-300 mb-2">How Escalation Works</h3>
                    <p className="text-sm text-slate-400">
                        When an alert is not acknowledged, it automatically escalates through these levels.
                        Each level increases volume and changes the sound to ensure you notice critical events.
                    </p>
                </div>

                {/* Escalation Timeline */}
                <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-6">Escalation Timeline</h2>

                    <div className="space-y-4">
                        {escalationLevels.map((level, index) => (
                            <div
                                key={level.level}
                                className={`relative flex items-start gap-4 p-4 rounded-lg border transition-all ${testingLevel === level.level
                                        ? 'bg-emerald-500/10 border-emerald-500/30'
                                        : 'bg-slate-900/50 border-slate-700/50'
                                    }`}
                            >
                                {/* Level indicator */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold ${LEVEL_COLORS[level.level as keyof typeof LEVEL_COLORS]
                                    }`}>
                                    {level.level}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-medium text-white">{level.name}</h3>
                                        <span className="px-2 py-0.5 text-xs font-mono bg-slate-700/50 text-slate-400 rounded">
                                            {level.soundType}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-3">{level.description}</p>

                                    {/* Delay control */}
                                    <div className="flex items-center gap-4">
                                        <label className="text-xs text-slate-500">Delay:</label>
                                        {index === 0 ? (
                                            <span className="text-xs text-slate-400">Immediate</span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="10"
                                                    max="600"
                                                    step="10"
                                                    value={level.delaySeconds}
                                                    onChange={(e) => updateLevelDelay(index, Number(e.target.value))}
                                                    className="w-20 px-2 py-1 text-sm bg-slate-800 border border-slate-600 rounded text-white text-center"
                                                />
                                                <span className="text-xs text-slate-500">seconds after previous</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Volume & Test */}
                                <div className="flex-shrink-0 text-right">
                                    <div className="mb-2">
                                        <span className="text-xs text-slate-500">Volume</span>
                                        <p className="text-sm font-mono text-white">
                                            {Math.round(level.volumeMultiplier * 100)}%
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => testEscalationLevel(level)}
                                        disabled={testingLevel !== null}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${testingLevel === level.level
                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                                            }`}
                                    >
                                        {testingLevel === level.level ? 'Playing...' : 'Test'}
                                    </button>
                                </div>

                                {/* Connection line */}
                                {index < escalationLevels.length - 1 && (
                                    <div className="absolute left-9 top-14 w-0.5 h-8 bg-gradient-to-b from-slate-600 to-transparent" />
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Global Timing Settings */}
                <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-4">Timing Settings</h2>

                    <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Cooldown Period: {timingSettings.cooldownPeriod}s
                            </label>
                            <input
                                type="range"
                                min="10"
                                max="300"
                                step="10"
                                value={timingSettings.cooldownPeriod}
                                onChange={(e) => updateTimingSettings({ cooldownPeriod: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Time between repeated alerts for the same event
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Emergency Escalation: {timingSettings.emergencyEscalationDelay}s
                            </label>
                            <input
                                type="range"
                                min="60"
                                max="600"
                                step="30"
                                value={timingSettings.emergencyEscalationDelay}
                                onChange={(e) => updateTimingSettings({ emergencyEscalationDelay: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                Time before auto-escalation to emergency level (0 = disabled)
                            </p>
                        </div>
                    </div>
                </section>

                {/* Per-Severity Cooldowns */}
                <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                    <h2 className="text-lg font-semibold text-white mb-2">Per-Severity Cooldowns</h2>
                    <p className="text-sm text-slate-400 mb-6">
                        Set different cooldown periods for each alert severity level. Lower severity alerts
                        wait longer before repeating, while critical alerts have no cooldown.
                    </p>

                    <div className="space-y-4">
                        {/* Info Severity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                                    <label className="text-sm font-medium text-slate-300">Info</label>
                                </div>
                                <span className="text-sm font-mono text-blue-400">{severityCooldowns.info}s</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="60"
                                step="5"
                                value={severityCooldowns.info}
                                onChange={(e) => updateSeverityCooldowns({ info: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-blue-500
                                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                                aria-label="Info severity cooldown"
                            />
                        </div>

                        {/* Low Severity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                                    <label className="text-sm font-medium text-slate-300">Low</label>
                                </div>
                                <span className="text-sm font-mono text-emerald-400">{severityCooldowns.low}s</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="120"
                                step="5"
                                value={severityCooldowns.low}
                                onChange={(e) => updateSeverityCooldowns({ low: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-emerald-500
                                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                                aria-label="Low severity cooldown"
                            />
                        </div>

                        {/* Medium Severity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-yellow-500" />
                                    <label className="text-sm font-medium text-slate-300">Medium</label>
                                </div>
                                <span className="text-sm font-mono text-yellow-400">{severityCooldowns.medium}s</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="180"
                                step="10"
                                value={severityCooldowns.medium}
                                onChange={(e) => updateSeverityCooldowns({ medium: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-yellow-500
                                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                                aria-label="Medium severity cooldown"
                            />
                        </div>

                        {/* High Severity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-orange-500" />
                                    <label className="text-sm font-medium text-slate-300">High</label>
                                </div>
                                <span className="text-sm font-mono text-orange-400">{severityCooldowns.high}s</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="300"
                                step="15"
                                value={severityCooldowns.high}
                                onChange={(e) => updateSeverityCooldowns({ high: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-orange-500
                                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                                aria-label="High severity cooldown"
                            />
                        </div>

                        {/* Critical Severity */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-red-500" />
                                    <label className="text-sm font-medium text-slate-300">Critical</label>
                                </div>
                                <span className="text-sm font-mono text-red-400">
                                    {severityCooldowns.critical === 0 ? 'No cooldown' : `${severityCooldowns.critical}s`}
                                </span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="60"
                                step="5"
                                value={severityCooldowns.critical}
                                onChange={(e) => updateSeverityCooldowns({ critical: Number(e.target.value) })}
                                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
                                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5
                                           [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:bg-red-500
                                           [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                                aria-label="Critical severity cooldown"
                            />
                            <p className="text-xs text-slate-500 mt-2">
                                Critical alerts typically have no cooldown to ensure immediate attention.
                            </p>
                        </div>
                    </div>

                    {/* Reset to Defaults */}
                    <button
                        onClick={() => updateSeverityCooldowns({
                            info: 5,
                            low: 10,
                            medium: 30,
                            high: 60,
                            critical: 0,
                        })}
                        className="mt-4 px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                    >
                        Reset to defaults
                    </button>
                </section>

                {/* Auto-Emergency Toggle */}
                <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-medium text-white">Auto-Emergency Mode</h3>
                            <p className="text-sm text-slate-400 mt-1">
                                Automatically escalate high-severity alerts to emergency after timeout
                            </p>
                        </div>
                        <button
                            onClick={() => updateGlobalSettings({ emergencyMode: !globalSettings.emergencyMode })}
                            className={`relative w-14 h-7 rounded-full transition-colors ${globalSettings.emergencyMode ? 'bg-emerald-500' : 'bg-slate-600'
                                }`}
                        >
                            <span
                                className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${globalSettings.emergencyMode ? 'left-8' : 'left-1'
                                    }`}
                            />
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}

// =============================================================================
// Level Colors
// =============================================================================

const LEVEL_COLORS = {
    1: 'bg-blue-500/20 text-blue-400',
    2: 'bg-emerald-500/20 text-emerald-400',
    3: 'bg-yellow-500/20 text-yellow-400',
    4: 'bg-orange-500/20 text-orange-400',
    5: 'bg-red-500/20 text-red-400',
};

// =============================================================================
// Icons
// =============================================================================

function ChevronLeftIcon() {
    return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
    );
}
