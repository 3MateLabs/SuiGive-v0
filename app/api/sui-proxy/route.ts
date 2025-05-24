import { NextResponse } from 'next/server';

// Simple in-memory request tracking for rate limiting
const requestTracker = {
  lastRequestTime: 0,
  requestCount: 0,
  resetTime: 0,
};

// RPC endpoints to try in order
const RPC_ENDPOINTS = [
  'https://fullnode.testnet.sui.io:443',
  'https://sui-testnet.nodeinfra.com',
  'https://sui-testnet-rpc.allthatnode.com',
];

// Exponential backoff retry function
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3) {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      // Add delay between retries with exponential backoff
      if (retries > 0) {
        const delay = Math.min(Math.pow(2, retries) * 500, 5000); // 500ms, 1s, 2s, 4s, max 5s
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      // Try different endpoints if we've retried
      const endpoint = RPC_ENDPOINTS[retries % RPC_ENDPOINTS.length];
      console.log(`Trying endpoint: ${endpoint} (attempt ${retries + 1})`);
      
      // Implement basic rate limiting
      const now = Date.now();
      if (now - requestTracker.lastRequestTime < 100) { // Ensure at least 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      requestTracker.lastRequestTime = Date.now();
      requestTracker.requestCount++;
      
      const response = await fetch(endpoint, options);
      
      // If we get a 429, wait longer before retrying
      if (response.status === 429) {
        console.log('Rate limited (429), backing off...');
        retries++;
        const retryAfter = response.headers.get('Retry-After');
        const retryDelay = retryAfter ? parseInt(retryAfter) * 1000 : Math.min(Math.pow(2, retries) * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      retries++;
      console.log(`Fetch attempt ${retries} failed:`, error);
    }
  }
  
  throw lastError || new Error('Max retries reached');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Sui proxy request:', JSON.stringify(body).substring(0, 200) + '...');
    
    // Forward the request to the Sui RPC endpoint with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    };
    
    // Use our retry function instead of a single fetch
    const response = await fetchWithRetry(RPC_ENDPOINTS[0], options);
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Sui RPC error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Sui RPC error: ${response.status} ${response.statusText}` },
        { status: response.status === 429 ? 503 : response.status } // Convert 429 to 503 for better client handling
      );
    }
    
    // Get the response data
    const data = await response.json();
    console.log('Sui proxy response:', JSON.stringify(data).substring(0, 200) + '...');
    
    // Return the response
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in Sui proxy:', error);
    const status = error.name === 'AbortError' ? 504 : 500; // Gateway Timeout for aborted requests
    return NextResponse.json(
      { error: `Failed to proxy request to Sui RPC: ${error.message}` },
      { status }
    );
  }
}
