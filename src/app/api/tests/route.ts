import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const testSchema = z.object({
  name: z.string().min(1),
  persona: z.string().min(1),
  scenario: z.string().min(1),
  goals: z.array(z.string().min(1)),
});

export async function GET() {
  try {
    const tests = await prisma.test.findMany({
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(
      tests.map((test) => ({
        ...test,
        goals: JSON.parse(test.goals),
      }))
    );
  } catch (error) {
    console.error('Error fetching tests:', error);
    return NextResponse.json({ error: 'Failed to fetch tests' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = testSchema.parse(body);

    const test = await prisma.test.create({
      data: {
        name: validatedData.name,
        persona: validatedData.persona,
        scenario: validatedData.scenario,
        goals: JSON.stringify(validatedData.goals),
      },
    });

    return NextResponse.json({
      ...test,
      goals: validatedData.goals,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error creating test:', error);
    return NextResponse.json({ error: 'Failed to create test' }, { status: 500 });
  }
}
