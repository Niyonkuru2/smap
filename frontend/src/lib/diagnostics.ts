// Diagnostic utility for debugging "Failed to fetch" errors

export async function checkBackendHealth(apiUrl: string): Promise<{
  isHealthy: boolean;
  latency: number;
  error?: string;
  hints?: string[];
}> {
  const hints: string[] = [];
  const startTime = performance.now();

  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      credentials: 'include',
      signal: AbortSignal.timeout(10000),
    });

    const latency = performance.now() - startTime;

    if (response.ok) {
      return {
        isHealthy: true,
        latency: Math.round(latency),
      };
    } else {
      hints.push(`Backend returned HTTP ${response.status}`);
      return {
        isHealthy: false,
        latency: Math.round(latency),
        error: `HTTP ${response.status}`,
        hints,
      };
    }
  } catch (error: any) {
    const latency = performance.now() - startTime;
    const errorMsg = error.message || String(error);

    if (errorMsg.includes('Failed to fetch')) {
      hints.push('🔴 CORS issue OR backend not running');
      hints.push('1. Check if backend is deployed/running');
      hints.push('2. Verify API URL is correct: ' + apiUrl);
      hints.push('3. Check CORS headers in backend');
    } else if (errorMsg.includes('timeout') || error.name === 'TimeoutError') {
      hints.push('⏱️ Backend is too slow to respond');
      hints.push('1. Backend might be cold-starting (Render free tier)');
      hints.push('2. Try again in 30-60 seconds');
      hints.push('3. Server might be overloaded');
    } else if (errorMsg.includes('ERR_NAME_NOT_RESOLVED')) {
      hints.push('🌐 DNS error - domain not found');
      hints.push('1. Check API URL spelling: ' + apiUrl);
      hints.push('2. Verify backend is deployed to Render');
    } else if (errorMsg.includes('ERR_INVALID_URL')) {
      hints.push('❌ Invalid URL format');
      hints.push('1. URL must start with http:// or https://');
      hints.push('2. Current URL: ' + apiUrl);
    }

    return {
      isHealthy: false,
      latency: Math.round(latency),
      error: errorMsg,
      hints,
    };
  }
}

export async function testCORS(apiUrl: string): Promise<{
  isCorsEnabled: boolean;
  error?: string;
  details?: any;
}> {
  try {
    const response = await fetch(`${apiUrl}/cors-test`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    const data = await response.json();

    if (response.ok) {
      return {
        isCorsEnabled: true,
        details: data,
      };
    } else {
      return {
        isCorsEnabled: false,
        error: `CORS endpoint returned HTTP ${response.status}`,
        details: data,
      };
    }
  } catch (error: any) {
    return {
      isCorsEnabled: false,
      error: error.message,
    };
  }
}

export async function runDiagnostics(apiUrl: string): Promise<{
  summary: string;
  checks: {
    health: any;
    cors: any;
    apiUrl: string;
  };
}> {
  console.group('🔍 Running Backend Diagnostics...');
  console.log('Testing API URL:', apiUrl);

  const health = await checkBackendHealth(apiUrl);
  const cors = await testCORS(apiUrl);

  const summary =
    health.isHealthy && cors.isCorsEnabled
      ? '✅ Backend looks OK'
      : '❌ Backend has issues - see details below';

  console.table({
    'Backend Health': health.isHealthy ? '✅ OK' : '❌ Failed',
    'CORS Enabled': cors.isCorsEnabled ? '✅ OK' : '❌ Failed',
    'Latency': health.latency + 'ms',
    'Error': health.error || cors.error || 'None',
  });

  if (health.hints && health.hints.length > 0) {
    console.warn('💡 Hints for Health:', health.hints);
  }

  if (cors.error) {
    console.warn('⚠️ CORS Error:', cors.error);
  }

  console.groupEnd();

  return {
    summary,
    checks: {
      health,
      cors,
      apiUrl,
    },
  };
}

// Export a global diagnostic function for browser console
if (typeof window !== 'undefined') {
  (window as any).diagnoseSMPMPS = async () => {
    try {
      // Use dynamic API URL detection (same as main api.ts)
      let apiUrl = (window as any).API_BASE_URL;
      if (!apiUrl) {
        const host = window.location.hostname;
        if (host.includes('onrender.com')) {
          if (host === 'smpmps-test.onrender.com' || host === 'smpmps-frontend.onrender.com') {
            apiUrl = 'https://smpmps-backend.onrender.com';
          } else if (host.endsWith('-frontend.onrender.com')) {
            apiUrl = `https://${host.replace('-frontend.onrender.com', '-backend.onrender.com')}`;
          } else {
            apiUrl = `${window.location.protocol}//${host}`;
          }
        } else {
          apiUrl = 'http://localhost:3001';
        }
      }
      return await runDiagnostics(apiUrl);
    } catch (error) {
      console.error('Diagnostic failed:', error);
    }
  };
  console.log('💡 Tip: Run diagnoseSMPMPS() in browser console to test backend connectivity');
}
