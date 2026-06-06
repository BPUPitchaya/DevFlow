import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerTypingIndicator } from '@/lib/pusher';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Upsert typing indicator
    await prisma.typingIndicator.upsert({
      where: {
        conversationId_userId: {
          conversationId: params.id,
          userId,
        },
      },
      update: {
        lastTypedAt: new Date(),
      },
      create: {
        conversationId: params.id,
        userId,
      },
    });

    // Trigger real-time event
    await triggerTypingIndicator(params.id, { userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Set typing indicator error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get typing indicators from last 5 seconds
    const fiveSecondsAgo = new Date(Date.now() - 5000);
    
    const typingIndicators = await prisma.typingIndicator.findMany({
      where: {
        conversationId: params.id,
        lastTypedAt: {
          gte: fiveSecondsAgo,
        },
        userId: {
          not: userId, // Don't include current user
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(typingIndicators);
  } catch (error) {
    console.error('Fetch typing indicators error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
