/**
 * Data Lineage and Observability System
 * Tracks data flow, transformations, and system health across ProCheff
 */

// Data Lineage Types
export interface DataLineageNode {
  id: string
  type: 'source' | 'transformation' | 'destination'
  name: string
  timestamp: string
  metadata: Record<string, any>
  parentNodes: string[]
  transformations?: Array<{
    operation: string
    parameters: Record<string, any>
    confidence: number
  }>
}

export interface DataFlowTrace {
  traceId: string
  startTime: string
  endTime?: string
  nodes: DataLineageNode[]
  status: 'running' | 'completed' | 'failed' | 'degraded'
  metrics: {
    totalProcessingTime: number
    nodesProcessed: number
    fallbacksUsed: number
    errorCount: number
  }
}

// System Health Metrics
export interface SystemMetrics {
  timestamp: string
  apiEndpoints: Record<string, {
    responseTime: number
    successRate: number
    errorRate: number
    totalRequests: number
  }>
  aiServices: {
    claude: {
      available: boolean
      responseTime: number
      tokensUsed: number
      successRate: number
    }
  }
  marketData: Record<string, {
    available: boolean
    responseTime: number
    successRate: number
    lastUpdate: string
  }>
  system: {
    memoryUsage: number
    cpuUsage: number
    diskUsage: number
    uptime: number
  }
}

// Observability Manager
export class ObservabilityManager {
  private traces = new Map<string, DataFlowTrace>()
  private metrics: SystemMetrics[] = []
  private maxTraceHistory = 1000
  private maxMetricsHistory = 100
  
  // Data Lineage Tracking
  startTrace(operation: string, input: any): string {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const trace: DataFlowTrace = {
      traceId,
      startTime: new Date().toISOString(),
      nodes: [{
        id: `${traceId}-source`,
        type: 'source',
        name: operation,
        timestamp: new Date().toISOString(),
        metadata: {
          operation,
          inputSize: JSON.stringify(input).length,
          inputType: typeof input
        },
        parentNodes: []
      }],
      status: 'running',
      metrics: {
        totalProcessingTime: 0,
        nodesProcessed: 1,
        fallbacksUsed: 0,
        errorCount: 0
      }
    }
    
    this.traces.set(traceId, trace)
    
    // Clean up old traces
    if (this.traces.size > this.maxTraceHistory) {
      const oldestTrace = Array.from(this.traces.keys())[0]
      this.traces.delete(oldestTrace)
    }
    
    return traceId
  }

  addTransformation(
    traceId: string,
    operation: string,
    input: any,
    output: any,
    confidence: number,
    processingTime: number
  ) {
    const trace = this.traces.get(traceId)
    if (!trace) return

    const nodeId = `${traceId}-transform-${trace.nodes.length}`
    const parentNodeId = trace.nodes[trace.nodes.length - 1]?.id || ''

    const transformationNode: DataLineageNode = {
      id: nodeId,
      type: 'transformation',
      name: operation,
      timestamp: new Date().toISOString(),
      metadata: {
        operation,
        inputSize: JSON.stringify(input).length,
        outputSize: JSON.stringify(output).length,
        processingTime,
        confidence
      },
      parentNodes: [parentNodeId],
      transformations: [{
        operation,
        parameters: input,
        confidence
      }]
    }

    trace.nodes.push(transformationNode)
    trace.metrics.nodesProcessed++
    trace.metrics.totalProcessingTime += processingTime
  }

  addFallback(traceId: string, originalError: string, fallbackUsed: string, success: boolean) {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.metrics.fallbacksUsed++
    if (!success) {
      trace.metrics.errorCount++
    }

    const nodeId = `${traceId}-fallback-${trace.nodes.length}`
    const parentNodeId = trace.nodes[trace.nodes.length - 1]?.id || ''

    const fallbackNode: DataLineageNode = {
      id: nodeId,
      type: 'transformation',
      name: `fallback-${fallbackUsed}`,
      timestamp: new Date().toISOString(),
      metadata: {
        originalError,
        fallbackStrategy: fallbackUsed,
        success
      },
      parentNodes: [parentNodeId]
    }

    trace.nodes.push(fallbackNode)
    trace.status = success ? 'degraded' : 'failed'
  }

  endTrace(traceId: string, output: any, success: boolean) {
    const trace = this.traces.get(traceId)
    if (!trace) return

    trace.endTime = new Date().toISOString()
    trace.status = success ? (trace.status === 'degraded' ? 'degraded' : 'completed') : 'failed'
    
    const nodeId = `${traceId}-destination`
    const parentNodeId = trace.nodes[trace.nodes.length - 1]?.id || ''

    const destinationNode: DataLineageNode = {
      id: nodeId,
      type: 'destination',
      name: 'result',
      timestamp: new Date().toISOString(),
      metadata: {
        outputSize: JSON.stringify(output).length,
        success
      },
      parentNodes: [parentNodeId]
    }

    trace.nodes.push(destinationNode)
    trace.metrics.nodesProcessed++
  }

  // System Metrics Collection
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date().toISOString()
    
    const metrics: SystemMetrics = {
      timestamp,
      apiEndpoints: await this.collectApiMetrics(),
      aiServices: {
        claude: await this.checkClaudeService()
      },
      marketData: await this.collectMarketDataMetrics(),
      system: {
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: 0, // Would need process monitoring
        diskUsage: 0, // Would need filesystem monitoring  
        uptime: process.uptime()
      }
    }
    
    this.metrics.push(metrics)
    
    // Clean up old metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift()
    }
    
    return metrics
  }

  private async collectApiMetrics() {
    // In a real implementation, this would collect from request logs
    return {
      '/api/menu/analyze-v2': {
        responseTime: 2500,
        successRate: 0.95,
        errorRate: 0.05,
        totalRequests: 150
      },
      '/api/market/prices': {
        responseTime: 1800,
        successRate: 0.92,
        errorRate: 0.08,
        totalRequests: 89
      },
      '/api/health': {
        responseTime: 50,
        successRate: 1.0,
        errorRate: 0,
        totalRequests: 500
      }
    }
  }

  private async checkClaudeService() {
    try {
      const startTime = Date.now()
      // In a real implementation, this would ping Claude API
      const responseTime = Date.now() - startTime
      
      return {
        available: true,
        responseTime,
        tokensUsed: 1250,
        successRate: 0.94
      }
    } catch (error) {
      return {
        available: false,
        responseTime: 0,
        tokensUsed: 0,
        successRate: 0
      }
    }
  }

  private async collectMarketDataMetrics() {
    const markets = ['a101', 'bim', 'migros', 'sok']
    const metrics: Record<string, any> = {}
    
    for (const market of markets) {
      // Simulate market health check
      const available = Math.random() > 0.1 // 90% uptime
      metrics[market] = {
        available,
        responseTime: available ? Math.random() * 3000 + 500 : 0,
        successRate: available ? 0.85 + Math.random() * 0.15 : 0,
        lastUpdate: new Date(Date.now() - Math.random() * 3600000).toISOString()
      }
    }
    
    return metrics
  }

  // Query Methods
  getTrace(traceId: string): DataFlowTrace | undefined {
    return this.traces.get(traceId)
  }

  getRecentTraces(limit: number = 10): DataFlowTrace[] {
    return Array.from(this.traces.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit)
  }

  getSystemHealth(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    metrics: SystemMetrics | null
    issues: string[]
  } {
    const latestMetrics = this.metrics[this.metrics.length - 1]
    if (!latestMetrics) {
      return { status: 'unhealthy', metrics: null, issues: ['No metrics available'] }
    }

    const issues: string[] = []
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // Check API endpoints
    Object.entries(latestMetrics.apiEndpoints).forEach(([endpoint, metrics]) => {
      if (metrics.errorRate > 0.1) {
        issues.push(`High error rate on ${endpoint}: ${(metrics.errorRate * 100).toFixed(1)}%`)
        status = 'degraded'
      }
      if (metrics.responseTime > 5000) {
        issues.push(`Slow response time on ${endpoint}: ${metrics.responseTime}ms`)
        status = 'degraded'
      }
    })

    // Check AI services
    if (!latestMetrics.aiServices.claude.available) {
      issues.push('Claude AI service unavailable')
      status = 'degraded'
    }

    // Check market data
    const unavailableMarkets = Object.entries(latestMetrics.marketData)
      .filter(([_, metrics]) => !metrics.available)
      .map(([market]) => market)
    
    if (unavailableMarkets.length > 0) {
      issues.push(`Market data unavailable: ${unavailableMarkets.join(', ')}`)
      if (unavailableMarkets.length > 2) {
        status = 'degraded'
      }
    }

    // Check system resources
    if (latestMetrics.system.memoryUsage > 500) { // 500MB threshold
      issues.push(`High memory usage: ${latestMetrics.system.memoryUsage.toFixed(1)}MB`)
      status = 'degraded'
    }

    if (issues.length > 5) {
      status = 'unhealthy'
    }

    return { status, metrics: latestMetrics, issues }
  }

  // Export methods for debugging
  exportTraces(): DataFlowTrace[] {
    return Array.from(this.traces.values())
  }

  exportMetrics(): SystemMetrics[] {
    return [...this.metrics]
  }
}

// Global observability instance
export const observability = new ObservabilityManager()

// Convenience functions
export async function withObservability<T>(
  operation: string,
  input: any,
  fn: (traceId: string) => Promise<T>
): Promise<T> {
  const traceId = observability.startTrace(operation, input)
  
  try {
    const result = await fn(traceId)
    observability.endTrace(traceId, result, true)
    return result
  } catch (error) {
    observability.endTrace(traceId, { error: error instanceof Error ? error.message : 'Unknown error' }, false)
    throw error
  }
}

export function logDataTransformation(
  traceId: string,
  operation: string,
  input: any,
  output: any,
  confidence: number,
  processingTime: number
) {
  observability.addTransformation(traceId, operation, input, output, confidence, processingTime)
}
