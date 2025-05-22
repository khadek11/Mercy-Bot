import { NextResponse } from 'next/server';
import * as jose from 'jose';
import prisma from './connectDB';

const protectApiRoute = (handler) => async (request, params) => {
  // Try to get token from cookies first (existing approach)
  let token = request.cookies.get('jwt')?.value;
  
  // If no cookie token, try Authorization header (new approach for frontend)
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    }
  }

  if (!token) {
    console.error('API route protection error: No token provided');
    return NextResponse.json({ message: 'Not authorized, no token' }, { status: 401 });
  }

  try {
    // Create the secret key from your environment variable
    const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
    
    // Verify the token with jose
    const { payload } = await jose.jwtVerify(token, secretKey);
    
    // Find the user in the database
    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        email: true, // Select other fields you need, excluding password
        // Removed 'name' field since it doesn't exist in your User model
      },
    });

    if (!user) {
      console.error('API route protection error: User not found after token verification');
      return NextResponse.json({ message: 'User not found' }, { status: 401 });
    }

    request.user = user; // Attach user to request

    return handler(request, params);
  } catch (error) {
    console.error('API route protection error:', error.message);
    return NextResponse.json({ message: 'Not authorized, token failed' }, { status: 401 });
  }
};

export default protectApiRoute;