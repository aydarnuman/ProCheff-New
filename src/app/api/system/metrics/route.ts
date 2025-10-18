import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface SystemMetrics {
  cpu: {
    usage: number;
    cores: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  disk: {
    used: number;
    total: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connectionsActive: number;
  };
  application: {
    activeUsers: number;
    requestsPerMinute: number;
    averageResponseTime: number;
    errorRate: number;
  };
  timestamp: string;
}

// Simulate realistic system metrics
function generateMetrics(): SystemMetrics {
  // CPU metrics
  const cpuUsage = Math.floor(Math.random() * 80) + 10; // 10-90%
  const loadAverage = [
    Math.random() * 2 + 0.5,
    Math.random() * 2 + 0.3,
    Math.random() * 2 + 0.2
  ];

  // Memory metrics (8GB total)
  const memoryTotal = 8 * 1024 * 1024 * 1024; // 8GB in bytes
  const memoryUsed = Math.floor(memoryTotal * (Math.random() * 0.6 + 0.2)); // 20-80%
  
  // Disk metrics (500GB total)
  const diskTotal = 500 * 1024 * 1024 * 1024; // 500GB in bytes
  const diskUsed = Math.floor(diskTotal * (Math.random() * 0.5 + 0.3)); // 30-80%

  // Network metrics
  const bytesIn = Math.floor(Math.random() * 1000000000); // Random bytes
  const bytesOut = Math.floor(Math.random() * 500000000);
  const connectionsActive = Math.floor(Math.random() * 1000) + 50;

  // Application metrics
  const activeUsers = Math.floor(Math.random() * 2000) + 100;
  const requestsPerMinute = Math.floor(Math.random() * 5000) + 500;
  const averageResponseTime = Math.floor(Math.random() * 800) + 50; // 50-850ms
  const errorRate = Math.random() * 5; // 0-5%

  return {
    cpu: {
      usage: cpuUsage,
      cores: 4,
      loadAverage
    },
    memory: {
      used: memoryUsed,
      total: memoryTotal,
      percentage: Math.floor((memoryUsed / memoryTotal) * 100)
    },
    disk: {
      used: diskUsed,
      total: diskTotal,
      percentage: Math.floor((diskUsed / diskTotal) * 100)
    },
    network: {
      bytesIn,
      bytesOut,
      connectionsActive
    },
    application: {
      activeUsers,
      requestsPerMinute,
      averageResponseTime,
      errorRate
    },
    timestamp: new Date().toISOString()
  };
}

// Helper function to format bytes
function formatBytes(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
}

export async function GET() {
  try {
    const startTime = Date.now();
    const metrics = generateMetrics();
    const responseTime = Date.now() - startTime;

    // Add formatted versions for display
    const formattedMetrics = {
      ...metrics,
      formatted: {
        memory: {
          used: formatBytes(metrics.memory.used),
          total: formatBytes(metrics.memory.total),
          percentage: `${metrics.memory.percentage}%`
        },
        disk: {
          used: formatBytes(metrics.disk.used),
          total: formatBytes(metrics.disk.total),
          percentage: `${metrics.disk.percentage}%`
        },
        network: {
          bytesIn: formatBytes(metrics.network.bytesIn),
          bytesOut: formatBytes(metrics.network.bytesOut),
          throughput: `${Math.round((metrics.network.bytesIn + metrics.network.bytesOut) / 1024 / 1024)} MB/s`
        },
        application: {
          activeUsers: metrics.application.activeUsers.toLocaleString(),
          requestsPerMinute: metrics.application.requestsPerMinute.toLocaleString(),
          averageResponseTime: `${metrics.application.averageResponseTime}ms`,
          errorRate: `${metrics.application.errorRate.toFixed(2)}%`
        }
      }
    };

    // Determine alert levels
    const alerts = [];
    if (metrics.cpu.usage > 80) {
      alerts.push({ level: 'warning', message: 'Yüksek CPU kullanımı tespit edildi' });
    }
    if (metrics.memory.percentage > 85) {
      alerts.push({ level: 'critical', message: 'Bellek kullanımı kritik seviyede' });
    }
    if (metrics.disk.percentage > 90) {
      alerts.push({ level: 'critical', message: 'Disk alanı yetersiz' });
    }
    if (metrics.application.errorRate > 2) {
      alerts.push({ level: 'warning', message: 'Hata oranı normalin üzerinde' });
    }
    if (metrics.application.averageResponseTime > 500) {
      alerts.push({ level: 'warning', message: 'Yavaş yanıt süreleri tespit edildi' });
    }

    return NextResponse.json({
      metrics: formattedMetrics,
      alerts,
      meta: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        nextUpdate: new Date(Date.now() + 30000).toISOString() // Next update in 30 seconds
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Metrics-Version': '1.0',
        'X-Response-Time': `${responseTime}ms`
      }
    });

  } catch (error) {
    console.error('Metrics collection failed:', error);
    
    return NextResponse.json({
      error: 'Metrics collection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    });
  }
}
