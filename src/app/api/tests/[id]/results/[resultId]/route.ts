import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; resultId: string } }
) {
  try {
    await prisma.testResult.delete({
      where: {
        id: params.resultId,
        testId: params.id,
      },
    });

    return NextResponse.json({ message: 'Test result deleted successfully' });
  } catch (error) {
    console.error('Error deleting test result:', error);
    return NextResponse.json({ error: 'Failed to delete test result' }, { status: 500 });
  }
}
