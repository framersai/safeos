/**
 * Analytics Routes
 *
 * API routes for analytics dashboard data.
 *
 * @module api/routes/analytics
 */

import { Router, Request, Response } from 'express';
import { getSafeOSDatabase } from '../../db';

// =============================================================================
// Router
// =============================================================================

export const analyticsRoutes = Router();

// =============================================================================
// Types
// =============================================================================

interface TimeRangeConfig {
    days: number;
    dateFormat: string;
}

function getTimeRangeConfig(range: string): TimeRangeConfig {
    switch (range) {
        case '24h':
            return { days: 1, dateFormat: '%H:00' };
        case '7d':
            return { days: 7, dateFormat: '%m/%d' };
        case '30d':
            return { days: 30, dateFormat: '%m/%d' };
        case '90d':
            return { days: 90, dateFormat: '%m/%d' };
        case 'all':
            return { days: 365, dateFormat: '%Y-%m' };
        default:
            return { days: 7, dateFormat: '%m/%d' };
    }
}

// =============================================================================
// Routes
// =============================================================================

/**
 * GET /api/analytics - Get analytics dashboard data
 */
analyticsRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const db = await getSafeOSDatabase();
        const range = (req.query.range as string) || '7d';
        const { days } = getTimeRangeConfig(range);

        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);
        const since = sinceDate.toISOString();

        // Overview stats
        const alertCount = await db.get<{ count: number }>(
            `SELECT COUNT(*) as count FROM alerts WHERE created_at >= ?`,
            [since]
        );

        const streamCount = await db.get<{ count: number }>(
            `SELECT COUNT(DISTINCT id) as count FROM streams WHERE created_at >= ?`,
            [since]
        );

        const streamHours = await db.get<{ hours: number }>(
            `SELECT COALESCE(SUM(
        CASE 
          WHEN ended_at IS NOT NULL 
          THEN (julianday(ended_at) - julianday(started_at)) * 24
          ELSE (julianday('now') - julianday(started_at)) * 24
        END
      ), 0) as hours FROM streams WHERE started_at >= ?`,
            [since]
        );

        // AI usage stats from analysis results
        const aiStats = await db.get<{ total: number; cloud: number; avgMs: number }>(
            `SELECT 
        COUNT(*) as total, 
        COALESCE(SUM(is_cloud_fallback), 0) as cloud,
        COALESCE(AVG(processing_time_ms), 0) as avgMs
       FROM analysis_results WHERE created_at >= ?`,
            [since]
        );

        const totalAnalyses = aiStats?.total || 0;
        const cloudCount = aiStats?.cloud || 0;
        const localUsage = totalAnalyses > 0 ? ((totalAnalyses - cloudCount) / totalAnalyses) * 100 : 100;
        const cloudFallbackRate = totalAnalyses > 0 ? (cloudCount / totalAnalyses) * 100 : 0;

        // Alerts over time (grouped by date/hour)
        const alertsOverTime = await db.all<{ date: string; severity: string; count: number }>(
            `SELECT 
        strftime(?, created_at) as date,
        severity,
        COUNT(*) as count
       FROM alerts 
       WHERE created_at >= ?
       GROUP BY date, severity
       ORDER BY date`,
            [range === '24h' ? '%H:00' : '%m/%d', since]
        );

        // Process alerts over time into the expected format
        const alertsByDate = new Map<string, { critical: number; high: number; medium: number; low: number; total: number }>();
        for (const row of alertsOverTime) {
            if (!alertsByDate.has(row.date)) {
                alertsByDate.set(row.date, { critical: 0, high: 0, medium: 0, low: 0, total: 0 });
            }
            const entry = alertsByDate.get(row.date)!;
            const severity = row.severity as 'critical' | 'high' | 'medium' | 'low';
            if (entry[severity] !== undefined) {
                entry[severity] = row.count;
                entry.total += row.count;
            }
        }

        const alertsOverTimeFormatted = Array.from(alertsByDate.entries()).map(([date, counts]) => ({
            date,
            ...counts,
        }));

        // Alerts by severity totals
        const severityCounts = await db.all<{ severity: string; count: number }>(
            `SELECT severity, COUNT(*) as count FROM alerts WHERE created_at >= ? GROUP BY severity`,
            [since]
        );

        const severityColors: Record<string, string> = {
            critical: '#ef4444',
            high: '#f97316',
            medium: '#eab308',
            low: '#3b82f6',
        };

        const alertsBySeverity = severityCounts.map((row) => ({
            name: row.severity.charAt(0).toUpperCase() + row.severity.slice(1),
            value: row.count,
            color: severityColors[row.severity] || '#3b82f6',
        }));

        // Alerts by scenario
        const alertsByScenario = await db.all<{ scenario: string; count: number }>(
            `SELECT s.scenario, COUNT(a.id) as count
       FROM alerts a
       JOIN streams s ON a.stream_id = s.id
       WHERE a.created_at >= ?
       GROUP BY s.scenario`,
            [since]
        );

        // Hourly activity pattern (24 hours aggregated)
        const hourlyActivity = await db.all<{ hour: string; motion: number; audio: number; alerts: number }>(
            `SELECT 
        strftime('%H:00', created_at) as hour,
        COUNT(CASE WHEN severity IN ('low', 'medium') THEN 1 END) as motion,
        COUNT(CASE WHEN severity IN ('high') THEN 1 END) as audio,
        COUNT(*) as alerts
       FROM alerts
       WHERE created_at >= ?
       GROUP BY hour
       ORDER BY hour`,
            [since]
        );

        // Stream duration by date
        const streamDuration = await db.all<{ date: string; minutes: number }>(
            `SELECT 
        strftime('%m/%d', started_at) as date,
        COALESCE(SUM(
          CASE 
            WHEN ended_at IS NOT NULL 
            THEN (julianday(ended_at) - julianday(started_at)) * 24 * 60
            ELSE (julianday('now') - julianday(started_at)) * 24 * 60
          END
        ), 0) as minutes
       FROM streams
       WHERE started_at >= ?
       GROUP BY date
       ORDER BY date`,
            [since]
        );

        // AI performance by date
        const aiPerformance = await db.all<{ date: string; localMs: number; cloudMs: number; accuracy: number }>(
            `SELECT 
        strftime('%m/%d', created_at) as date,
        AVG(CASE WHEN is_cloud_fallback = 0 THEN processing_time_ms END) as localMs,
        AVG(CASE WHEN is_cloud_fallback = 1 THEN processing_time_ms END) as cloudMs,
        100.0 as accuracy
       FROM analysis_results
       WHERE created_at >= ?
       GROUP BY date
       ORDER BY date`,
            [since]
        );

        res.json({
            overview: {
                totalAlerts: alertCount?.count || 0,
                totalStreams: streamCount?.count || 0,
                totalHours: Math.round(streamHours?.hours || 0),
                localAiUsage: localUsage,
                cloudFallbackRate: cloudFallbackRate,
                avgResponseTime: aiStats?.avgMs || 0,
            },
            alertsOverTime: alertsOverTimeFormatted,
            alertsBySeverity,
            alertsByScenario: alertsByScenario.map((r) => ({
                scenario: r.scenario.charAt(0).toUpperCase() + r.scenario.slice(1),
                count: r.count,
            })),
            hourlyActivity,
            streamDuration,
            aiPerformance: aiPerformance.map((r) => ({
                date: r.date,
                localMs: r.localMs || 0,
                cloudMs: r.cloudMs || 0,
                accuracy: 95, // Placeholder until we have accuracy tracking
            })),
        });
    } catch (error) {
        console.error('Failed to get analytics:', error);
        res.status(500).json({ error: 'Failed to get analytics' });
    }
});

export default analyticsRoutes;
