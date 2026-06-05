import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerStandupUpdate, triggerBlockerNotification } from '@/lib/pusher';
import { z } from 'zod';

const standupSchema = z.object({
  completed: z.string().min(1),
  focus: z.string().min(1),
  blockers: z.string().optional(),
  isBlocked: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const teamId = request.headers.get('x-team-id');
    const date = request.nextUrl.searchParams.get('date');

    const where: any = {};
    if (userId) where.userId = userId;
    if (teamId) where.teamId = teamId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      where.date = { gte: startDate, lt: endDate };
    }

    const standups = await prisma.standup.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(standups);
  } catch (error) {
    console.error('Fetch standups error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    const userRole = request.headers.get('x-user-role');

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = standupSchema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { team: true },
    });

    if (!user || !user.teamId) {
      return NextResponse.json(
        { error: 'User not assigned to a team' },
        { status: 400 }
      );
    }

    const standup = await prisma.standup.create({
      data: {
        userId,
        teamId: user.teamId,
        completed: validatedData.completed,
        focus: validatedData.focus,
        blockers: validatedData.blockers,
        isBlocked: validatedData.isBlocked,
        status: validatedData.isBlocked ? 'BLOCKED' : 'SUBMITTED',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (validatedData.isBlocked) {
      await triggerBlockerNotification(user.teamId, standup);
    } else {
      await triggerStandupUpdate(user.teamId, standup);
    }

    return NextResponse.json(standup, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create standup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
