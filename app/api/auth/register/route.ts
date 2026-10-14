import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  hashPassword,
  isValidEmail,
  validatePassword,
  sanitizeInput,
} from '@/lib/security';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request payload.' },
        { status: 400 }
      );
    }

    const { name, email, password, role } = body;

    const cleanName = sanitizeInput(name, 100);
    const cleanEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    if (!cleanName || !cleanEmail || !password) {
      return NextResponse.json(
        { error: 'Name, email, and password are required.' },
        { status: 400 }
      );
    }

    if (!isValidEmail(cleanEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
      select: { id: true },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        password: hashPassword(password),
        role: role === 'ADMIN' ? 'ADMIN' : 'EMPLOYEE',
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email address already exists.' },
        { status: 409 }
      );
    }
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration. Please try again.' },
      { status: 500 }
    );
  }
}