import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerChannelMessageSent } from '@/lib/pusher';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member
    const member = await prisma.channelMember.findFirst({
      where: {
        channelId: params.id,
        userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this channel' },
        { status: 403 }
      );
    }

    const messages = await prisma.channelMessage.findMany({
      where: {
        channelId: params.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch channel messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content } = body as { content: string };

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check if user is a member
    const member = await prisma.channelMember.findFirst({
      where: {
        channelId: params.id,
        userId,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this channel' },
        { status: 403 }
      );
    }

    const message = await prisma.channelMessage.create({
      data: {
        content,
        channelId: params.id,
        senderId: userId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });

    // Trigger real-time event
    await triggerChannelMessageSent(params.id, message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Create channel message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
