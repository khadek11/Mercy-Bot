import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/utils/connectDB';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    if (!newUser) {
       console.error('Error creating new user: newUser is null');
       return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User registered successfully' }, { status: 201 });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
