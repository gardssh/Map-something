import { NextResponse } from 'next/server';
import * as fs from 'fs/promises';
import * as path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/data/enriched-cabins.json');
    const fileContents = await fs.readFile(filePath, 'utf8');
    const cabins = JSON.parse(fileContents);
    return NextResponse.json(cabins);
  } catch (error) {
    console.error('Error reading cabin data:', error);
    return NextResponse.json({ error: 'Failed to load cabin data' }, { status: 500 });
  }
} 