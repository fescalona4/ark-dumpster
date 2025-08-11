import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    skipEmailInDevelopment: process.env.SKIP_EMAIL_IN_DEVELOPMENT === 'true',
    environment: process.env.NODE_ENV
  });
}
