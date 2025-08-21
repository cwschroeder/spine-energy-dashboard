import { NextResponse } from 'next/server';
import { spineApi } from '@/lib/api/client';

export async function GET() {
  try {
    const token = spineApi.getApiToken();
    
    // Try to fetch devices to test the API
    const testResponse = await spineApi.getDeviceList(1, 1);
    
    return NextResponse.json({
      success: true,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      isDefaultToken: token === '7toghKl3d8hhkIa8fDe5ItXisW6yo6',
      apiTestSuccess: !!testResponse,
      message: 'API key is configured and working'
    });
  } catch (error: any) {
    const token = spineApi.getApiToken();
    return NextResponse.json({
      success: false,
      hasToken: !!token,
      tokenLength: token?.length || 0,
      isDefaultToken: token === '7toghKl3d8hhkIa8fDe5ItXisW6yo6',
      error: error?.message || 'Unknown error',
      message: 'API key test failed'
    }, { status: 500 });
  }
}