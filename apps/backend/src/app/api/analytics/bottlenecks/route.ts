import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const teamId = request.nextUrl.searchParams.get('teamId');
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const blockedStandups = await prisma.standup.findMany({
      where: {
        teamId,
        isBlocked: true,
        date: { gte: startDate },
      },
      select: {
        blockers: true,
        date: true,
      },
    });

    const bottleneckMap = new Map<string, number>();

    blockedStandups.forEach((standup) => {
      if (standup.blockers) {
        const keywords = standup.blockers
          .toLowerCase()
          .split(/\s+/)
          .filter((word) => word.length > 3);

        keywords.forEach((keyword) => {
          bottleneckMap.set(
            keyword,
            (bottleneckMap.get(keyword) || 0) + 1
          );
        });
      }
    });

    const bottlenecks = Array.from(bottleneckMap.entries())
      .map(([name, frequency]) => ({ name, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);

    return NextResponse.json(bottlenecks);
  } catch (error) {
    console.error('Bottleneck analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
