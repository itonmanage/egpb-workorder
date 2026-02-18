import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET /api/tickets/types - Get all unique types of damage
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getSession(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get distinct type_of_damage values
    const types = await prisma.ticket.findMany({
      select: {
        typeOfDamage: true,
      },
      distinct: ['typeOfDamage'],
      orderBy: {
        typeOfDamage: 'asc',
      },
    });

    const typeList = types.map(t => t.typeOfDamage);

    return NextResponse.json({
      success: true,
      data: { types: typeList },
    });
  } catch (error) {
    console.error('Get types error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

