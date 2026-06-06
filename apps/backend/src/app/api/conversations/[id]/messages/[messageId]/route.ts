import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerMessageUpdated, triggerMessageDeleted } from '@/lib/pusher';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
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

    // Check if user is the sender
    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== userId) {
      return NextResponse.json(
        { error: 'Can only edit your own messages' },
        { status: 403 }
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

    const updatedMessage = await prisma.message.update({
      where: { id: params.messageId },
      data: { content },
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
    await triggerMessageUpdated(params.id, updatedMessage);

    return NextResponse.json(updatedMessage);
  } catch (error) {
    console.error('Update message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; messageId: string } }
) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is the sender
    const message = await prisma.message.findUnique({
      where: { id: params.messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (message.senderId !== userId) {
      return NextResponse.json(
        { error: 'Can only delete your own messages' },
        { status: 403 }
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

    await prisma.message.delete({
      where: { id: params.messageId },
    });

    // Trigger real-time event
    await triggerMessageDeleted(params.id, params.messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
