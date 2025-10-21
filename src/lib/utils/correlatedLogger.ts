/**
 * Log Correlation & Context Management
 * Tüm loglarda traceability için ID tracking
 */

export interface LogContext {
  pipelineId?: string;
  jobId?: string;
  docHash?: string;
  tenderId?: string;
  simulationId?: string;
  offerId?: string;
  userId?: string;
  traceId?: string;
}

export interface CorrelatedLogEntry {
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR" | "FATAL";
  message: string;
  context: LogContext;
  service: string;
  version?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class CorrelatedLogger {
  private context: LogContext = {};
  private service: string = "procheff-api";
  private version: string = process.env.APP_VERSION || "1.0.0";

  constructor(initialContext?: LogContext) {
    if (initialContext) {
      this.context = { ...initialContext };
    }

    // Generate trace ID if not provided
    if (!this.context.traceId) {
      this.context.traceId = this.generateTraceId();
    }
  }

  setContext(context: Partial<LogContext>): void {
    this.context = { ...this.context, ...context };
  }

  getContext(): LogContext {
    return { ...this.context };
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(
    level: CorrelatedLogEntry["level"],
    message: string,
    error?: Error
  ): CorrelatedLogEntry {
    const entry: CorrelatedLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.getContext(),
      service: this.service,
      version: this.version,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private writeLog(entry: CorrelatedLogEntry): void {
    const logLine = JSON.stringify(entry);

    // Console output with correlation info
    const contextInfo = [
      entry.context.traceId && `trace:${entry.context.traceId.slice(-8)}`,
      entry.context.pipelineId &&
        `pipeline:${entry.context.pipelineId.slice(-8)}`,
      entry.context.tenderId && `tender:${entry.context.tenderId.slice(-8)}`,
      entry.context.offerId && `offer:${entry.context.offerId.slice(-8)}`,
    ]
      .filter(Boolean)
      .join(" ");

    const prefix = `[${entry.timestamp}] [${entry.level}] ${
      contextInfo ? `[${contextInfo}] ` : ""
    }`;

    switch (entry.level) {
      case "DEBUG":
        console.debug(prefix + entry.message);
        break;
      case "INFO":
        console.info(prefix + entry.message);
        break;
      case "WARN":
        console.warn(prefix + entry.message);
        break;
      case "ERROR":
      case "FATAL":
        console.error(prefix + entry.message);
        if (entry.error) {
          console.error("Error Details:", entry.error);
        }
        break;
    }

    // Write to structured log file (optional)
    if (process.env.STRUCTURED_LOGS === "true") {
      // In production, this would write to a proper log aggregation system
      process.stdout.write(logLine + "\n");
    }
  }

  debug(message: string): void {
    this.writeLog(this.createLogEntry("DEBUG", message));
  }

  info(message: string): void {
    this.writeLog(this.createLogEntry("INFO", message));
  }

  warn(message: string): void {
    this.writeLog(this.createLogEntry("WARN", message));
  }

  error(message: string, error?: Error): void {
    this.writeLog(this.createLogEntry("ERROR", message, error));
  }

  fatal(message: string, error?: Error): void {
    this.writeLog(this.createLogEntry("FATAL", message, error));
  }

  // Helper methods for common operations
  logPipelineStart(pipelineId: string, jobId: string, docHash: string): void {
    this.setContext({ pipelineId, jobId, docHash });
    this.info(`Pipeline started: ${pipelineId}`);
  }

  logOfferCreation(
    offerId: string,
    tenderId: string,
    simulationId: string
  ): void {
    this.setContext({ offerId, tenderId, simulationId });
    this.info(`Offer created: ${offerId} for tender: ${tenderId}`);
  }

  logPTMismatch(
    offerId: string,
    expected: number,
    actual: number,
    delta: number
  ): void {
    this.setContext({ offerId });
    this.error(
      `PT Mismatch detected - Expected: ${expected}, Actual: ${actual}, Delta: ${delta}`
    );
  }

  logADTRequirement(
    offerId: string,
    adtThreshold: number,
    offerAmount: number
  ): void {
    this.setContext({ offerId });
    this.warn(
      `ADT explanation required - Threshold: ${adtThreshold}, Offer: ${offerAmount}`
    );
  }

  logIdempotentDuplicate(docHash: string, existingTenderId: string): void {
    this.setContext({ docHash, tenderId: existingTenderId });
    this.info(
      `Idempotent duplicate detected - DocHash: ${docHash.slice(
        0,
        8
      )}... reusing tender: ${existingTenderId}`
    );
  }

  // Create child logger with extended context
  child(additionalContext: Partial<LogContext>): CorrelatedLogger {
    const childContext = { ...this.context, ...additionalContext };
    return new CorrelatedLogger(childContext);
  }
}

// Singleton instance for global usage
let globalLogger: CorrelatedLogger | null = null;

export function getLogger(context?: LogContext): CorrelatedLogger {
  if (!globalLogger || context) {
    globalLogger = new CorrelatedLogger(context);
  }
  return globalLogger;
}

// Middleware for request correlation
export function createRequestLogger(
  requestId?: string,
  userId?: string
): CorrelatedLogger {
  return new CorrelatedLogger({
    traceId:
      requestId ||
      `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
  });
}

export default CorrelatedLogger;
