import { NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from '@/utils/connectDB';

export async function GET(request) {
  try {
    // Try to get token from cookies first
    let token = request.cookies.get('jwt')?.value;
    
    // If no cookie token, try Authorization header
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    // Create the secret key from your environment variable
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // Verify the token with jose
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Find user
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        email: true,
        // Removed 'name' field since it doesn't exist in your User model
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({ 
      message: 'Token valid',
      user: user
    }, { status: 200 });

  } catch (error) {
    console.error('Auth check error:', error.message);
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }
}