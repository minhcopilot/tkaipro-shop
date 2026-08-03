import { NextRequest, NextResponse } from 'next/server';

import { SITE_HOST } from '~/app';

const INDEXNOW_KEY = process.env.NEXT_PUBLIC_INDEXNOW_KEY || '';

interface IndexNowRequest {
  urls: string[];
}

export async function POST(request: NextRequest) {
  try {
    const { urls } = await request.json() as IndexNowRequest;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    if (!INDEXNOW_KEY) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_INDEXNOW_KEY is not configured' }, { status: 500 });
    }

    // submit to IndexNow (Bing, Yandex, etc.)
    const response = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        host: SITE_HOST,
        key: INDEXNOW_KEY,
        keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
        urlList: urls.slice(0, 10000), // max 10,000 URLs per request
      }),
    });

    if (response.ok || response.status === 202) {
      return NextResponse.json({ 
        success: true, 
        message: `Submitted ${urls.length} URLs to IndexNow`,
        status: response.status 
      });
    }

    const errorText = await response.text();
    return NextResponse.json({ 
      success: false, 
      error: errorText,
      status: response.status 
    }, { status: response.status });

  } catch (error) {
    console.error('IndexNow error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    key: INDEXNOW_KEY,
    keyLocation: INDEXNOW_KEY ? `https://${SITE_HOST}/${INDEXNOW_KEY}.txt` : null
  });
}
