import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { z } from 'zod';

const configSchema = z.object({
  apiKey: z.string().min(1),
  testAgentPhoneNumber: z.string().min(1),
});

export async function GET() {
  try {
    const config = await prisma.agentConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });
    return NextResponse.json(config || {});
  } catch (error) {
    console.error('Error fetching config:', error);
    return NextResponse.json({ error: 'Failed to fetch configuration' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = configSchema.parse(body);

    const config = await prisma.agentConfig.create({
      data: {
        ...validatedData,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error saving config:', error);
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validatedData = configSchema.parse(body);

    const config = await prisma.agentConfig.upsert({
      where: {
        id: (await prisma.agentConfig.findFirst())?.id || 'default',
      },
      update: {
        ...validatedData,
      },
      create: {
        ...validatedData,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    console.error('Error updating config:', error);
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
  }
}
