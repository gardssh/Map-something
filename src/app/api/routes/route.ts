import { readFile, writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('Received data:', data);

    const filePath = path.join(process.cwd(), 'public/routes.json');
    console.log('Writing to:', filePath);

    await writeFile(filePath, JSON.stringify(data, null, 2));
    console.log('File written successfully');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to save routes' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public/routes.json');
    const fileContents = await readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContents);
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ error: 'Failed to read routes' }, { status: 500 });
  }
} 