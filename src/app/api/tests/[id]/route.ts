import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const testSchema = z.object({
  name: z.string().min(1),
  persona: z.string().min(1),
  scenario: z.string().min(1),
  goals: z.array(z.string().min(1)),
});

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

    return NextResponse.json({
      ...test,
      goals: JSON.parse(test.goals),
    });
  } catch (error) {
    console.error('Error fetching test:', error);
    return NextResponse.json({ error: 'Failed to fetch test' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = testSchema.parse(body);

    const test = await prisma.test.update({
      where: { id: params.id },
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
    console.error('Error updating test:', error);
    return NextResponse.json({ error: 'Failed to update test' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.test.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Test deleted successfully' });
  } catch (error) {
    console.error('Error deleting test:', error);
    return NextResponse.json({ error: 'Failed to delete test' }, { status: 500 });
  }
}
