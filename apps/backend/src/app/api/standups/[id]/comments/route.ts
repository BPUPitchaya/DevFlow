import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { triggerCommentAdded } from '@/lib/pusher';
import { z } from 'zod';

const commentSchema = z.object({
  content: z.string().min(1),
});

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
    const validatedData = commentSchema.parse(body);

    const standup = await prisma.standup.findUnique({
      where: { id: params.id },
    });

    if (!standup) {
      return NextResponse.json(
        { error: 'Standup not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        content: validatedData.content,
        userId,
        standupId: params.id,
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

    await triggerCommentAdded(standup.teamId, comment);

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
