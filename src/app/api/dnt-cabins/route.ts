import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'src/data/dnt-cabins.json');
    const fileContents = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(fileContents);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading DNT cabin data:', error);
    return NextResponse.json(
      { error: 'Failed to load DNT cabin data' },
      { status: 500 }
    );
  }
} 