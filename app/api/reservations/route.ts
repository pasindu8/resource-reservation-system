import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyUser, verifyAdmin, sanitizeInput } from '@/lib/security';

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        resource: { select: { id: true, name: true, type: true } },
      },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Fetch reservations error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve reservations.' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 }
      );
    }

    const { resourceId, userId, date, startHour, endHour, purpose } = body;

    // Validate required fields
    if (!resourceId || !userId || !date || startHour === undefined || endHour === undefined) {
      return NextResponse.json(
        { error: 'Missing required reservation parameters.' },
        { status: 400 }
      );
    }

    // Verify user exists and is authenticated
    const user = await verifyUser(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Invalid user account.' },
        { status: 401 }
      );
    }

    // Verify resource exists
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, name: true },
    });
    if (!resource) {
      return NextResponse.json(
        { error: 'Selected resource does not exist.' },
        { status: 404 }
      );
    }

    // Validate hour range
    const sHour = Number(startHour);
    const eHour = Number(endHour);

    if (
      isNaN(sHour) ||
      isNaN(eHour) ||
      sHour < 8 ||
      eHour > 20 ||
      sHour >= eHour ||
      !Number.isInteger(sHour) ||
      !Number.isInteger(eHour)
    ) {
      return NextResponse.json(
        { error: 'Invalid time selection. Operational hours are 08:00 to 20:00.' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Expected YYYY-MM-DD.' },
        { status: 400 }
      );
    }

    const startTime = new Date(`${date}T${String(sHour).padStart(2, '0')}:00:00`);
    const endTime = new Date(`${date}T${String(eHour).padStart(2, '0')}:00:00`);

    if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
      return NextResponse.json(
        { error: 'Invalid reservation timestamp.' },
        { status: 400 }
      );
    }

    // Sanitize purpose string
    const cleanPurpose = sanitizeInput(purpose, 200);
    if (!cleanPurpose) {
      return NextResponse.json(
        { error: 'Reservation purpose is required.' },
        { status: 400 }
      );
    }

    // Overlap conflict detection
    const conflict = await prisma.reservation.findFirst({
      where: {
        resourceId,
        AND: [
          { startTime: { lt: endTime } },
          { endTime: { gt: startTime } },
        ],
      },
      select: { id: true, startTime: true, endTime: true },
    });

    if (conflict) {
      return NextResponse.json(
        { error: 'The selected time slot conflicts with an existing booking.' },
        { status: 409 }
      );
    }

    const reservation = await prisma.reservation.create({
      data: {
        resourceId,
        userId: user.id,
        startTime,
        endTime,
        purpose: cleanPurpose,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        resource: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(reservation, { status: 201 });
  } catch (error) {
    console.error('Create reservation error:', error);
    return NextResponse.json(
      { error: 'Failed to process reservation.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const requesterId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id || typeof id !== 'string') {
      return NextResponse.json(
        { error: 'Reservation ID is required.' },
        { status: 400 }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation record not found.' },
        { status: 404 }
      );
    }

    // Authorization check: Must be the owner or an ADMIN
    const isAdmin = await verifyAdmin(requesterId);
    const isOwner = requesterId === reservation.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Forbidden. You do not have permission to cancel this reservation.' },
        { status: 403 }
      );
    }

    await prisma.reservation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cancel reservation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel reservation.' },
      { status: 500 }
    );
  }
}