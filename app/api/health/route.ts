import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    uptime: number;
    checks: {
        database: {
            status: 'ok' | 'error';
            responseTime?: number;
            error?: string;
        };
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
        system: {
            nodeVersion: string;
            platform: string;
            arch: string;
        };
    };
}

export async function GET() {
    const healthCheck: HealthCheckResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
            database: {
                status: 'ok',
            },
            memory: {
                used: 0,
                total: 0,
                percentage: 0,
            },
            system: {
                nodeVersion: process.version,
                platform: process.platform,
                arch: process.arch,
            },
        },
    };

    try {
        // Check database connection
        const dbStartTime = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        const dbResponseTime = Date.now() - dbStartTime;

        healthCheck.checks.database = {
            status: 'ok',
            responseTime: dbResponseTime,
        };

        // If database is slow, mark as degraded
        if (dbResponseTime > 1000) {
            healthCheck.status = 'degraded';
        }
    } catch (error) {
        healthCheck.status = 'unhealthy';
        healthCheck.checks.database = {
            status: 'error',
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    healthCheck.checks.memory = {
        used: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        total: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    // If memory usage is high, mark as degraded
    if (healthCheck.checks.memory.percentage > 90) {
        healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'healthy' ? 200 :
        healthCheck.status === 'degraded' ? 200 : 503;

    return NextResponse.json(healthCheck, {
        status: statusCode,
        headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
    });
}
