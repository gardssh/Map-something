import { NextResponse } from 'next/server';
import { getActivities } from '@/features/map/api/activities/route';

export async function GET(request: Request) {
    return getActivities();
} 