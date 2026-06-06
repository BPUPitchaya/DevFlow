import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerMessageSent, triggerMessageUpdated, triggerMessageDeleted } from '@/lib/pusher';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: params.id,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: params.id,
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

    // Update last read
    await prisma.conversationParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
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
    const { content, parentMessageId } = body as { content: string; parentMessageId?: string };

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Check if user is a participant
    const participant = await prisma.conversationParticipant.findFirst({
      where: {
        conversationId: params.id,
        userId,
      },
    });

    if (!participant) {
      return NextResponse.json(
        { error: 'Not a participant in this conversation' },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        conversationId: params.id,
        senderId: userId,
        parentMessageId,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        parentMessage: {
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update conversation timestamp
    await prisma.conversation.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    });

    // Trigger real-time event
    await triggerMessageSent(params.id, message);

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
