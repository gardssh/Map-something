import { NextResponse } from 'next/server';

export async function handleHMR() {
  return NextResponse.next();
}

export const dynamic = 'force-dynamic'; 