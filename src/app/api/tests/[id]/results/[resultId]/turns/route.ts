import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const conversationTurnSchema = z.object({
  speaker: z.enum(['agent', 'tester']),
  message: z.string().min(1),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string; resultId: string } }
) {
  try {
    const turns = await prisma.conversationTurn.findMany({
      where: { testResultId: params.resultId },
      orderBy: { timestamp: 'asc' },
    });

    return NextResponse.json(turns);
  } catch (error) {
    console.error('Error fetching conversation turns:', error);
    return NextResponse.json({ error: 'Failed to fetch conversation turns' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string; resultId: string } }
) {
  try {
    const body = await request.json();
    const validatedData = conversationTurnSchema.parse(body);

    // Verify that the test result exists and is running
    const testResult = await prisma.testResult.findFirst({
      where: {
        id: params.resultId,
        testId: params.id,
        status: 'running',
      },
    });

    if (!testResult) {
      return NextResponse.json({ error: 'Test result not found or not running' }, { status: 404 });
    }

    const turn = await prisma.conversationTurn.create({
      data: {
        testResultId: params.resultId,
        speaker: validatedData.speaker,
        message: validatedData.message,
      },
    });

    return NextResponse.json(turn);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating conversation turn:', error);
    return NextResponse.json({ error: 'Failed to create conversation turn' }, { status: 500 });
  }
}
