import * as jose from 'jose';

const generateToken = async (res, userId) => {
  // Create the secret key from your environment variable
  const secretKey = new TextEncoder().encode(process.env.JWT_SECRET);
  
  // Generate the token with jose
  const token = await new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // 30 days, matching your original setting
    .sign(secretKey);
  
  // Set JWT as HTTP-only cookie with more debugging
  res.cookies.set('jwt', token, {
    httpOnly: true, 
    secure: process.env.NODE_ENV !== 'development',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });

  console.log('generateToken: Cookie set on response:', res.cookies);
  console.log('Cookie header:', res.cookies._headers.get('set-cookie'));
};

export default generateToken;