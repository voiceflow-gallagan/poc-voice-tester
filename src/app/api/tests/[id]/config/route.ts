import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: params.id },
    });

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Find the current running test result
    const currentResult = await prisma.testResult.findFirst({
      where: {
        testId: params.id,
        status: 'running',
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    // Parse the goals from JSON string
    const goals = JSON.parse(test.goals);

    // Return the test configuration with the current result ID
    return NextResponse.json({
      id: test.id,
      name: test.name,
      persona: test.persona,
      scenario: test.scenario,
      goals: goals,
      currentTestResultId: currentResult?.id || null,
    });
  } catch (error) {
    console.error('Error fetching test config:', error);
    return NextResponse.json({ error: 'Failed to fetch test configuration' }, { status: 500 });
  }
}

