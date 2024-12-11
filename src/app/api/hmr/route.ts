import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.next();
}

export const dynamic = 'force-dynamic'; 