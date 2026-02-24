import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { SystemOptionCategory } from '@prisma/client';
import {
    IT_DAMAGE_TYPES, IT_AREAS,
    ENGINEER_DAMAGE_TYPES, ENGINEER_AREAS, DEPARTMENTS
} from '@/lib/constants';

function getFallback(category: SystemOptionCategory): string[] {
    switch (category) {
        case 'IT_DAMAGE_TYPE': return [...IT_DAMAGE_TYPES];
        case 'IT_AREA': return [...IT_AREAS];
        case 'ENGINEER_DAMAGE_TYPE': return [...ENGINEER_DAMAGE_TYPES];
        case 'ENGINEER_AREA': return [...ENGINEER_AREAS];
        case 'DEPARTMENT': return [...DEPARTMENTS];
        default: return [];
    }
}

// GET /api/admin/settings/options/public?category=IT_DAMAGE_TYPE
// Accessible by any authenticated user - returns active options or fallback to constants
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') as SystemOptionCategory | null;

        if (!category) {
            return NextResponse.json({ error: 'category is required' }, { status: 400 });
        }

        const options = await prisma.systemOption.findMany({
            where: { category, isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
            select: { value: true, label: true },
        });

        if (options.length === 0) {
            const fallback = getFallback(category).map(v => ({ value: v, label: v }));
            return NextResponse.json({ success: true, data: fallback, source: 'fallback' });
        }

        return NextResponse.json({ success: true, data: options, source: 'database' });
    } catch (error) {
        console.error('[GET /api/admin/settings/options/public]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
