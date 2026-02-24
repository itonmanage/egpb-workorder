import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { SystemOptionCategory } from '@prisma/client';
import {
    IT_DAMAGE_TYPES, IT_AREAS,
    ENGINEER_DAMAGE_TYPES, ENGINEER_AREAS, DEPARTMENTS
} from '@/lib/constants';

function getDefaultsForCategory(category: SystemOptionCategory): string[] {
    switch (category) {
        case 'IT_DAMAGE_TYPE': return [...IT_DAMAGE_TYPES];
        case 'IT_AREA': return [...IT_AREAS];
        case 'ENGINEER_DAMAGE_TYPE': return [...ENGINEER_DAMAGE_TYPES];
        case 'ENGINEER_AREA': return [...ENGINEER_AREAS];
        case 'DEPARTMENT': return [...DEPARTMENTS];
        default: return [];
    }
}

// GET /api/admin/settings/options?category=IT_DAMAGE_TYPE
export async function GET(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category') as SystemOptionCategory | null;

        const where = category ? { category } : {};
        const options = await prisma.systemOption.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
        });

        // If no options exist for a category, seed from constants
        if (category) {
            const activeOptions = options.filter(o => o.isActive);
            if (activeOptions.length === 0) {
                const defaults = getDefaultsForCategory(category);
                const created = await prisma.$transaction(
                    defaults.map((val, idx) =>
                        prisma.systemOption.upsert({
                            where: { category_value: { category, value: val } },
                            create: { category, value: val, label: val, sortOrder: idx },
                            update: {},
                        })
                    )
                );
                return NextResponse.json({ success: true, data: created });
            }
        }

        return NextResponse.json({ success: true, data: options });
    } catch (error) {
        console.error('[GET /api/admin/settings/options]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/settings/options
export async function POST(request: NextRequest) {
    try {
        const token = request.cookies.get('auth-token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await getSession(token);
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { category, value, label, sortOrder } = body;

        if (!category || !value || !label) {
            return NextResponse.json({ error: 'category, value, and label are required' }, { status: 400 });
        }

        if (!Object.values(SystemOptionCategory).includes(category as SystemOptionCategory)) {
            return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
        }

        // Check for duplicate value in category
        const existing = await prisma.systemOption.findUnique({
            where: { category_value: { category: category as SystemOptionCategory, value } },
        });
        if (existing) {
            return NextResponse.json({ error: 'Option with this value already exists in this category' }, { status: 409 });
        }

        // Auto-assign sortOrder if not provided
        let order = sortOrder;
        if (order === undefined || order === null) {
            const maxOrder = await prisma.systemOption.aggregate({
                where: { category: category as SystemOptionCategory },
                _max: { sortOrder: true },
            });
            order = (maxOrder._max.sortOrder ?? -1) + 1;
        }

        const option = await prisma.systemOption.create({
            data: {
                category: category as SystemOptionCategory,
                value,
                label,
                sortOrder: order,
            },
        });

        return NextResponse.json({ success: true, data: option }, { status: 201 });
    } catch (error) {
        console.error('[POST /api/admin/settings/options]', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
