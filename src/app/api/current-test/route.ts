import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Find the most recent running test result
    const currentResult = await prisma.testResult.findFirst({
      where: {
        status: 'running',
      },
      orderBy: {
        startTime: 'desc',
      },
      include: {
        test: true,  // Include the associated test data
      },
    });

    if (!currentResult) {
      return NextResponse.json({ error: 'No active test found' }, { status: 404 });
    }

    // Parse the goals from JSON string
    const goals = JSON.parse(currentResult.test.goals);

    // Return both test configuration and result information
    return NextResponse.json({
      test: {
        id: currentResult.test.id,
        name: currentResult.test.name,
        persona: currentResult.test.persona,
        scenario: currentResult.test.scenario,
        goals: goals,
      },
      result: {
        id: currentResult.id,
        status: currentResult.status,
        completedGoals: JSON.parse(currentResult.completedGoals),
        failedGoals: JSON.parse(currentResult.failedGoals),
        startTime: currentResult.startTime,
        endTime: currentResult.endTime,
      },
    });
  } catch (error) {
    console.error('Error fetching current test:', error);
    return NextResponse.json({ error: 'Failed to fetch current test' }, { status: 500 });
  }
}
