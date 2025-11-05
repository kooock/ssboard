import { NextRequest, NextResponse } from 'next/server';

// Runtime proxy for all /api/* requests
// This allows BACKEND_URL to be read at runtime, not build time

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  const path = params.path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${backendUrl}/api/${path}${searchParams ? `?${searchParams}` : ''}`;
  
  console.log(`[Proxy GET] ${url}`);
  
  const token = request.headers.get('authorization');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const response = await fetch(url, { headers });
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[Proxy Error] ${url}:`, error);
    return NextResponse.json(
      { error: 'Backend request failed' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  const path = params.path.join('/');
  const url = `${backendUrl}/api/${path}`;
  
  console.log(`[Proxy POST] ${url}`);
  
  const token = request.headers.get('authorization');
  const body = await request.json();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[Proxy Error] ${url}:`, error);
    return NextResponse.json(
      { error: 'Backend request failed' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  const path = params.path.join('/');
  const url = `${backendUrl}/api/${path}`;
  
  console.log(`[Proxy PUT] ${url}`);
  
  const token = request.headers.get('authorization');
  const body = await request.json();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[Proxy Error] ${url}:`, error);
    return NextResponse.json(
      { error: 'Backend request failed' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8080';
  const path = params.path.join('/');
  const url = `${backendUrl}/api/${path}`;
  
  console.log(`[Proxy DELETE] ${url}`);
  
  const token = request.headers.get('authorization');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = token;
  }

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
    });
    
    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`[Proxy Error] ${url}:`, error);
    return NextResponse.json(
      { error: 'Backend request failed' },
      { status: 500 }
    );
  }
}

