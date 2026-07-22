export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { searchLocations } from '@/lib/location';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') ?? '';
    const results = await searchLocations(q);
    return NextResponse.json({ results });
  } catch (error: unknown) {
    console.error('Location search error:', error);
    return NextResponse.json({ results: [] });
  }
}
