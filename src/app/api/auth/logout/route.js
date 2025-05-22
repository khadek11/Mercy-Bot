import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ message: 'Logout successful' }, { status: 200 });

    // Clear the JWT cookie
    response.cookies.set('jwt', '', {
      httpOnly: true,
      expires: new Date(0), // Set expiry to a past date
      path: '/', // Ensure the path matches the cookie path set during login
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
