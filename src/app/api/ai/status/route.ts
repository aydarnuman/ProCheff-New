import { NextResponse } from 'next/server';

export const runtime = 'edge';

interface AIServiceStatus {
  service: string;
  status: 'online' | 'degraded' | 'offline';
  responseTime: number;
  lastSuccessfulRequest: string;
  errorRate: number;
  requestsInQueue: number;
  version: string;
  capabilities: string[];
  usage: {
    requestsToday: number;
    tokensProcessed: number;
    averageProcessingTime: number;
  };
}

interface AISystemStatus {
  overall: 'operational' | 'degraded' | 'major_outage';
  services: AIServiceStatus[];
  timestamp: string;
  systemLoad: number;
  aiModelsLoaded: number;
  totalAiModels: number;
}

function generateAIServiceStatus(serviceName: string, baseResponseTime: number): AIServiceStatus {
  const isHealthy = Math.random() > 0.15; // 85% chance of being healthy
  const responseTime = isHealthy 
    ? baseResponseTime + Math.floor(Math.random() * 100)
    : baseResponseTime + Math.floor(Math.random() * 2000) + 500;

  const status: 'online' | 'degraded' | 'offline' = 
    isHealthy 
      ? (responseTime > baseResponseTime * 2 ? 'degraded' : 'online')
      : (Math.random() > 0.3 ? 'degraded' : 'offline');

  const capabilities: Record<string, string[]> = {
    'Menu Analysis Engine': ['text_extraction', 'price_analysis', 'ingredient_detection', 'nutritional_calc'],
    'Market Price Predictor': ['price_forecasting', 'trend_analysis', 'seasonal_adjustment', 'volatility_calc'],
    'Cost Optimization AI': ['ingredient_substitution', 'portion_optimization', 'waste_reduction', 'profit_maximization'],
    'Recipe Recommender': ['cuisine_matching', 'dietary_restriction', 'seasonal_recipes', 'popularity_scoring'],
    'Image Recognition': ['food_identification', 'quality_assessment', 'portion_estimation', 'allergen_detection']
  };

  return {
    service: serviceName,
    status,
    responseTime,
    lastSuccessfulRequest: new Date(Date.now() - Math.random() * 3600000).toISOString(), // Within last hour
    errorRate: status === 'online' ? Math.random() * 2 : Math.random() * 15 + 5, // 0-2% or 5-20%
    requestsInQueue: Math.floor(Math.random() * (status === 'online' ? 10 : 100)),
    version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
    capabilities: capabilities[serviceName] || ['general_ai'],
    usage: {
      requestsToday: Math.floor(Math.random() * 10000) + 1000,
      tokensProcessed: Math.floor(Math.random() * 1000000) + 100000,
      averageProcessingTime: responseTime
    }
  };
}

export async function GET() {
  try {
    const startTime = Date.now();

    // Generate AI service statuses
    const aiServices = [
      'Menu Analysis Engine',
      'Market Price Predictor', 
      'Cost Optimization AI',
      'Recipe Recommender',
      'Image Recognition'
    ].map((service, index) => generateAIServiceStatus(service, (index + 1) * 200));

    // Calculate overall system status
    const onlineServices = aiServices.filter(s => s.status === 'online').length;
    const degradedServices = aiServices.filter(s => s.status === 'degraded').length;
    const offlineServices = aiServices.filter(s => s.status === 'offline').length;

    let overall: 'operational' | 'degraded' | 'major_outage';
    if (offlineServices >= 2 || (offlineServices >= 1 && degradedServices >= 2)) {
      overall = 'major_outage';
    } else if (degradedServices >= 2 || offlineServices >= 1) {
      overall = 'degraded';
    } else {
      overall = 'operational';
    }

    // System load calculation
    const systemLoad = Math.min(100, Math.floor(
      (aiServices.reduce((sum, s) => sum + s.requestsInQueue, 0) / aiServices.length) * 2 +
      (aiServices.reduce((sum, s) => sum + s.errorRate, 0) / aiServices.length) * 3
    ));

    const aiSystemStatus: AISystemStatus = {
      overall,
      services: aiServices,
      timestamp: new Date().toISOString(),
      systemLoad,
      aiModelsLoaded: Math.floor(Math.random() * 5) + 8, // 8-12 models loaded
      totalAiModels: 12
    };

    const responseTime = Date.now() - startTime;

    // Generate recommendations based on status
    const recommendations = [];
    if (overall === 'major_outage') {
      recommendations.push('Kritik AI servisleri çevrimdışı - acil müdahale gerekli');
    } else if (overall === 'degraded') {
      recommendations.push('Bazı AI servisleri yavaş - performans optimizasyonu öneriliyor');
    }

    if (systemLoad > 80) {
      recommendations.push('Sistem yükü yüksek - ek kaynak tahsisi düşünülmeli');
    }

    const highErrorServices = aiServices.filter(s => s.errorRate > 10);
    if (highErrorServices.length > 0) {
      recommendations.push(`Yüksek hata oranı: ${highErrorServices.map(s => s.service).join(', ')}`);
    }

    return NextResponse.json({
      ...aiSystemStatus,
      recommendations,
      meta: {
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
        apiVersion: '2.1.0',
        nextScheduledMaintenance: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week from now
      }
    }, {
      status: overall === 'major_outage' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-AI-System-Status': overall,
        'X-Response-Time': `${responseTime}ms`,
        'X-System-Load': systemLoad.toString()
      }
    });

  } catch (error) {
    console.error('AI status check failed:', error);
    
    return NextResponse.json({
      overall: 'major_outage',
      services: [],
      timestamp: new Date().toISOString(),
      systemLoad: 100,
      aiModelsLoaded: 0,
      totalAiModels: 12,
      error: 'AI status system failure',
      meta: {
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID()
      }
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-AI-System-Status': 'major_outage'
      }
    });
  }
}
