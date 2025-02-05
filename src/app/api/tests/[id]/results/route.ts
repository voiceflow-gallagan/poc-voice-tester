import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const conversationTurnSchema = z.object({
  speaker: z.enum(['agent', 'tester']),
  message: z.string().min(1),
});

const testResultSchema = z.object({
  status: z.enum(['running', 'completed', 'failed']).optional(),
  completedGoals: z.array(z.string()).optional(),
  failedGoals: z.array(z.string()).optional(),
  error: z.string().optional(),
});

type TestResultWithTurns = {
  id: string;
  testId: string;
  status: string;
  completedGoals: string;
  failedGoals: string;
  startTime: Date;
  endTime: Date | null;
  error: string | null;
  conversationTurns: Array<{
    id: string;
    testResultId: string;
    speaker: string;
    message: string;
    timestamp: Date;
  }>;
};

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const results = await prisma.testResult.findMany({
      where: { testId: params.id },
      orderBy: { startTime: 'desc' },
      take: 10,
      include: {
        conversationTurns: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return NextResponse.json(
      results.map((result: TestResultWithTurns) => ({
        ...result,
        completedGoals: JSON.parse(result.completedGoals || '[]'),
        failedGoals: JSON.parse(result.failedGoals || '[]'),
      }))
    );
  } catch (error) {
    console.error('Error fetching test results:', error);
    return NextResponse.json({ error: 'Failed to fetch test results' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, verify that the test exists
    const test = await prisma.test.findUnique({
      where: { id: params.id },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    const testResult = await prisma.testResult.create({
      data: {
        testId: params.id,
        status: 'running',
        completedGoals: '[]',
        failedGoals: '[]',
      },
      include: {
        conversationTurns: true,
      },
    });

    return NextResponse.json({
      ...testResult,
      completedGoals: [],
      failedGoals: [],
    });
  } catch (error) {
    console.error('Error creating test result:', error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to create test result' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = testResultSchema.parse(body);

    const testResult = await prisma.testResult.findFirst({
      where: {
        testId: params.id,
        status: 'running',
      },
    });

    if (!testResult) {
      return NextResponse.json({ error: 'No active test result found' }, { status: 404 });
    }

    const updates: any = {
      ...(validatedData.status && { status: validatedData.status }),
      ...(validatedData.completedGoals && { completedGoals: JSON.stringify(validatedData.completedGoals) }),
      ...(validatedData.failedGoals && { failedGoals: JSON.stringify(validatedData.failedGoals) }),
      ...(validatedData.error && { error: validatedData.error }),
    };

    if (validatedData.status === 'completed' || validatedData.status === 'failed') {
      updates.endTime = new Date();
    }

    const updatedResult = await prisma.testResult.update({
      where: { id: testResult.id },
      data: updates,
      include: {
        conversationTurns: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    return NextResponse.json({
      ...updatedResult,
      completedGoals: validatedData.completedGoals || JSON.parse(updatedResult.completedGoals),
      failedGoals: validatedData.failedGoals || JSON.parse(updatedResult.failedGoals),
    });
  } catch (error) {
    console.error('Error updating test result:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'Failed to update test result' }, { status: 500 });
  }
}
