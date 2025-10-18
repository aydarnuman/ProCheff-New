/**
 * Comprehensive Error Handling System
 * Provides structured error types, fallback mechanisms, and recovery strategies
 */

// Error Type Definitions
export enum ErrorCode {
  // Menu Analysis Errors
  MENU_ANALYSIS_FAILED = 'MENU_ANALYSIS_FAILED',
  MENU_TEXT_INVALID = 'MENU_TEXT_INVALID',
  AI_SERVICE_UNAVAILABLE = 'AI_SERVICE_UNAVAILABLE',
  
  // Market Data Errors
  MARKET_FETCH_FAILED = 'MARKET_FETCH_FAILED',
  MARKET_INVALID = 'MARKET_INVALID',
  MARKET_RATE_LIMITED = 'MARKET_RATE_LIMITED',
  
  // System Errors
  DATABASE_CONNECTION_FAILED = 'DATABASE_CONNECTION_FAILED',
  EXTERNAL_API_TIMEOUT = 'EXTERNAL_API_TIMEOUT',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  
  // Generic Errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface ErrorDetails {
  code: ErrorCode
  message: string
  originalError?: Error
  context?: Record<string, any>
  timestamp: string
  retryable: boolean
  fallbackAvailable: boolean
}

export class ProCheffError extends Error {
  public readonly code: ErrorCode
  public readonly context: Record<string, any>
  public readonly timestamp: string
  public readonly retryable: boolean
  public readonly fallbackAvailable: boolean
  public readonly originalError?: Error

  constructor(details: ErrorDetails) {
    super(details.message)
    this.name = 'ProCheffError'
    this.code = details.code
    this.context = details.context || {}
    this.timestamp = details.timestamp
    this.retryable = details.retryable
    this.fallbackAvailable = details.fallbackAvailable
    this.originalError = details.originalError
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      fallbackAvailable: this.fallbackAvailable,
      stack: this.stack
    }
  }
}

// Error Factory Functions
export function createMenuAnalysisError(
  message: string, 
  originalError?: Error,
  context?: Record<string, any>
): ProCheffError {
  return new ProCheffError({
    code: ErrorCode.MENU_ANALYSIS_FAILED,
    message,
    originalError,
    context,
    timestamp: new Date().toISOString(),
    retryable: true,
    fallbackAvailable: true
  })
}

export function createMarketFetchError(
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): ProCheffError {
  return new ProCheffError({
    code: ErrorCode.MARKET_FETCH_FAILED,
    message,
    originalError,
    context,
    timestamp: new Date().toISOString(),
    retryable: true,
    fallbackAvailable: true
  })
}

export function createValidationError(
  message: string,
  context?: Record<string, any>
): ProCheffError {
  return new ProCheffError({
    code: ErrorCode.VALIDATION_ERROR,
    message,
    context,
    timestamp: new Date().toISOString(),
    retryable: false,
    fallbackAvailable: false
  })
}

export function createAIServiceError(
  message: string,
  originalError?: Error,
  context?: Record<string, any>
): ProCheffError {
  return new ProCheffError({
    code: ErrorCode.AI_SERVICE_UNAVAILABLE,
    message,
    originalError,
    context,
    timestamp: new Date().toISOString(),
    retryable: true,
    fallbackAvailable: true
  })
}

// Fallback Strategy Interface
export interface FallbackStrategy<T> {
  execute(error: ProCheffError, originalInput: any): Promise<T>
  canHandle(error: ProCheffError): boolean
  priority: number
}

// Retry Strategy Interface
export interface RetryStrategy {
  maxRetries: number
  backoffMultiplier: number
  initialDelay: number
  maxDelay: number
}

// Error Handler Class
export class ErrorHandler {
  private fallbackStrategies: Map<ErrorCode, FallbackStrategy<any>[]> = new Map()
  private retryStrategy: RetryStrategy = {
    maxRetries: 3,
    backoffMultiplier: 2,
    initialDelay: 1000,
    maxDelay: 10000
  }

  registerFallback<T>(errorCode: ErrorCode, strategy: FallbackStrategy<T>) {
    if (!this.fallbackStrategies.has(errorCode)) {
      this.fallbackStrategies.set(errorCode, [])
    }
    this.fallbackStrategies.get(errorCode)!.push(strategy)
    // Sort by priority (higher priority first)
    this.fallbackStrategies.get(errorCode)!.sort((a, b) => b.priority - a.priority)
  }

  async handleWithFallback<T>(
    operation: () => Promise<T>,
    errorCode: ErrorCode,
    originalInput: any
  ): Promise<T> {
    try {
      return await this.executeWithRetry(operation)
    } catch (error) {
      const procheffError = error instanceof ProCheffError 
        ? error 
        : new ProCheffError({
            code: errorCode,
            message: error instanceof Error ? error.message : 'Unknown error',
            originalError: error instanceof Error ? error : undefined,
            timestamp: new Date().toISOString(),
            retryable: true,
            fallbackAvailable: true
          })

      // Try fallback strategies
      const strategies = this.fallbackStrategies.get(procheffError.code) || []
      
      for (const strategy of strategies) {
        if (strategy.canHandle(procheffError)) {
          try {
            return await strategy.execute(procheffError, originalInput)
          } catch (fallbackError) {
            console.warn(`Fallback strategy failed:`, fallbackError)
            continue
          }
        }
      }

      // If no fallback worked, throw the original error
      throw procheffError
    }
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation()
    } catch (error) {
      if (attempt >= this.retryStrategy.maxRetries) {
        throw error
      }

      const procheffError = error instanceof ProCheffError ? error : null
      if (procheffError && !procheffError.retryable) {
        throw error
      }

      const delay = Math.min(
        this.retryStrategy.initialDelay * Math.pow(this.retryStrategy.backoffMultiplier, attempt - 1),
        this.retryStrategy.maxDelay
      )

      await new Promise(resolve => setTimeout(resolve, delay))
      return this.executeWithRetry(operation, attempt + 1)
    }
  }
}

// Default Error Handler Instance
export const errorHandler = new ErrorHandler()

// Utility Functions
export function isRetryableError(error: Error): boolean {
  if (error instanceof ProCheffError) {
    return error.retryable
  }
  
  // Common retryable error patterns
  const retryablePatterns = [
    /timeout/i,
    /network/i,
    /connection/i,
    /rate limit/i,
    /service unavailable/i
  ]
  
  return retryablePatterns.some(pattern => pattern.test(error.message))
}

export function sanitizeErrorForClient(error: ProCheffError): {
  code: string
  message: string
  retryable: boolean
  fallbackAvailable: boolean
  timestamp: string
} {
  return {
    code: error.code,
    message: error.message,
    retryable: error.retryable,
    fallbackAvailable: error.fallbackAvailable,
    timestamp: error.timestamp
  }
}

export function logError(error: Error, context?: Record<string, any>) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    name: error.name,
    message: error.message,
    stack: error.stack,
    context
  }

  if (error instanceof ProCheffError) {
    Object.assign(errorLog, {
      code: error.code,
      procheffContext: error.context,
      retryable: error.retryable,
      fallbackAvailable: error.fallbackAvailable
    })
  }

  console.error('ProCheff Error:', JSON.stringify(errorLog, null, 2))
}
