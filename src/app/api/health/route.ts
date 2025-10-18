import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'offline';
  responseTime: number;
  timestamp: string;
  details?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical';
  services: HealthCheck[];
  uptime: string;
  version: string;
  environment: string;
}

async function checkServiceHealth(url: string, serviceName: string): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'ProCheff-HealthCheck/1.0' }
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      service: serviceName,
      status: response.ok ? 'healthy' : 'degraded',
      responseTime,
      timestamp: new Date().toISOString(),
      details: response.ok ? undefined : `HTTP ${response.status}`
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      service: serviceName,
      status: 'offline',
      responseTime,
      timestamp: new Date().toISOString(),
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function GET() {
  try {
    const startTime = Date.now();
    
    // Check external services
    const healthChecks = await Promise.all([
      checkServiceHealth('https://httpbin.org/status/200', 'External API Test'),
      checkServiceHealth('https://api.github.com/zen', 'GitHub API'),
      // Add more real service checks here
    ]);

    // Simulate internal service checks
    const internalServices: HealthCheck[] = [
      {
        service: 'Database',
        status: Math.random() > 0.1 ? 'healthy' : 'degraded',
        responseTime: Math.floor(Math.random() * 50) + 10,
        timestamp: new Date().toISOString()
      },
      {
        service: 'AI Analysis API',
        status: Math.random() > 0.2 ? 'healthy' : 'degraded',
        responseTime: Math.floor(Math.random() * 1000) + 200,
        timestamp: new Date().toISOString()
      },
      {
        service: 'Market Data API',
        status: Math.random() > 0.05 ? 'healthy' : 'offline',
        responseTime: Math.floor(Math.random() * 300) + 50,
        timestamp: new Date().toISOString()
      },
      {
        service: 'File Upload Service',
        status: 'healthy',
        responseTime: Math.floor(Math.random() * 100) + 20,
        timestamp: new Date().toISOString()
      }
    ];

    const allServices = [...healthChecks, ...internalServices];
    
    // Determine overall health
    const healthyCount = allServices.filter(s => s.status === 'healthy').length;
    const degradedCount = allServices.filter(s => s.status === 'degraded').length;
    const offlineCount = allServices.filter(s => s.status === 'offline').length;
    
    let overall: 'healthy' | 'degraded' | 'critical';
    if (offlineCount > 0 || degradedCount > allServices.length / 2) {
      overall = 'critical';
    } else if (degradedCount > 0) {
      overall = 'degraded';
    } else {
      overall = 'healthy';
    }

    // Calculate uptime (simulated - in real app this would come from monitoring)
    const uptimeHours = Math.floor(Math.random() * 24 * 15) + 24; // 1-15 days
    const days = Math.floor(uptimeHours / 24);
    const hours = uptimeHours % 24;
    const uptime = `${days} gün ${hours} saat`;

    const healthData: SystemHealth = {
      overall,
      services: allServices,
      uptime,
      version: '1.1.0',
      environment: process.env.NODE_ENV || 'development'
    };

    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      ...healthData,
      meta: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, {
      status: overall === 'critical' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      overall: 'critical',
      services: [],
      uptime: 'unknown',
      version: '1.1.0',
      environment: process.env.NODE_ENV || 'development',
      error: 'Health check system failure',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Health-Check': 'true'
      }
    });
  }
}
