import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { developmentScopes } from '@/lib/db/schema';

export async function GET() {
  try {
    const scopes = await db
      .select({
        id: developmentScopes.id,
        name: developmentScopes.name,
      })
      .from(developmentScopes);

    return NextResponse.json({
      data: scopes,
      total: scopes.length,
    });
  } catch (error) {
    console.error('Error fetching development scopes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch development scopes' },
      { status: 500 }
    );
  }
}
