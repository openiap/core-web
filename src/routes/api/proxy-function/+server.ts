import { json } from '@sveltejs/kit';

// Helper function to handle fetch with retry logic
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 10) {
  let lastResponse;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // If we get a Bad Gateway response and have retries left, wait and try again
      if (response.status === 502 && attempt < maxRetries) {
        console.log(`Received Bad Gateway (502), retrying in 2 seconds... (Attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        continue;
      }
      
      return response; // Return successful response or final failed response
    } catch (error) {
      lastError = error;
      
      // If we have retries left, wait and try again
      if (attempt < maxRetries) {
        console.log(`Fetch error, retrying in 2 seconds... (Attempt ${attempt + 1}/${maxRetries + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
        continue;
      }
    }
  }
  
  // If we got here due to errors on all attempts, throw the last error
  if (lastError) {
    throw lastError;
  }
  
  return lastResponse;
}

export async function POST({ request }) {
  try {
    const { url, urlParameters, method, body } = await request.json();
    
    // Default to GET if method is not specified
    const requestMethod = method || 'GET';
    
    // Configure fetch options
    const fetchOptions: RequestInit = {
      method: requestMethod,
      headers: { 'Content-Type': 'application/json' }
    };
    
    // Only add body for non-GET requests and when body is provided
    if (requestMethod !== 'GET' && body) {
      fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
    }
    
    // Make the request to the target service with retry support
    const response = await fetchWithRetry(
      `${url}/?${urlParameters || ''}`,
      fetchOptions,
      5 // Allow 1 retry (total of 2 attempts)
    );
    
    // Read the response
    let responseData;
    if(response == null) {
      return json({
        status: 502,
        statusText: 'Bad Gateway',
        error: 'No response received'
      }, { status: 502 });
    }
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
    
    // Return the response with the original status code
    return json({
      status: response.status,
      statusText: response.statusText,
      data: responseData
    });
  } catch (error:any) {
    console.error('Proxy error:', error);
    return json({
      status: 500,
      statusText: 'Internal Server Error',
      error: error.message
    }, { status: 500 });
  }
}
