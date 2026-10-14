import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin, sanitizeInput } from '@/lib/security';

export async function GET() {
  try {
    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json(resources);
  } catch (error) {
    console.error('Fetch resources error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve resources.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const requesterId = req.headers.get('x-user-id');
    const isAdmin = await verifyAdmin(requesterId);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Administrator authorization required.' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 }
      );
    }

    const { name, type, capacity, status } = body;

    const cleanName = sanitizeInput(name, 100);
    const cleanType = sanitizeInput(type || 'room', 50);
    const cleanStatus = sanitizeInput(status || 'AVAILABLE', 100);

    if (!cleanName) {
      return NextResponse.json(
        { error: 'Resource name is required.' },
        { status: 400 }
      );
    }

    let parsedCapacity: number | null = null;
    if (capacity !== undefined && capacity !== null && capacity !== '') {
      const num = Number(capacity);
      if (isNaN(num) || num < 1 || num > 5000) {
        return NextResponse.json(
          { error: 'Capacity must be a positive integer between 1 and 5000.' },
          { status: 400 }
        );
      }
      parsedCapacity = Math.floor(num);
    }

    const resource = await prisma.resource.create({
      data: {
        name: cleanName,
        type: cleanType,
        capacity: parsedCapacity,
        status: cleanStatus,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error('Create resource error:', error);
    return NextResponse.json(
      { error: 'Failed to create resource.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const requesterId = req.headers.get('x-user-id');
    const isAdmin = await verifyAdmin(requesterId);

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Administrator authorization required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Valid resource ID is required.' },
        { status: 400 }
      );
    }

    const existing = await prisma.resource.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Resource not found.' },
        { status: 404 }
      );
    }

    // Cascade delete associated reservations securely
    await prisma.reservation.deleteMany({ where: { resourceId: id } });
    await prisma.resource.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete resource error:', error);
    return NextResponse.json(
      { error: 'Failed to delete resource.' },
      { status: 500 }
    );
  }
}