import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get('teamId');
    const sprintId = request.nextUrl.searchParams.get('sprintId');
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const standups = await prisma.standup.findMany({
      where: {
        teamId,
        date: { gte: startDate },
        ...(sprintId && { sprintId }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { date: 'asc' },
    });

    const velocityData = standups.reduce((acc, standup) => {
      const dateKey = standup.date.toISOString().split('T')[0];
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          total: 0,
          blocked: 0,
          users: new Set(),
        };
      }
      acc[dateKey].total++;
      if (standup.isBlocked) acc[dateKey].blocked++;
      acc[dateKey].users.add(standup.userId);
      return acc;
    }, {} as Record<string, any>);

    const formattedData = Object.values(velocityData).map((day: any) => ({
      date: day.date,
      total: day.total,
      blocked: day.blocked,
      uniqueUsers: day.users.size,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Velocity analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
