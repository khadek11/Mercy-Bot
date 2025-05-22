import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import generateToken from '@/utils/generateToken';
import prisma from '@/utils/connectDB';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Generate JWT token and set as HTTP-only cookie
    const response = NextResponse.json({ message: 'Login successful' }, { status: 200 });
    generateToken(response, user.id); // Assuming generateToken sets the cookie on the response and uses user.id

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
