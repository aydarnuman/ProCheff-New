/**
 * ProCheff Structured Logging System
 * Cloud Run ve monitoring için optimize edilmiş logging
 */

export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
  statusCode?: number;
  errorCode?: string;
  service?: string;
  component?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  version: string;
  environment: string;
  context?: LogContext;
}

class Logger {
  private service: string = "procheff";
  private version: string = process.env.GIT_SHA || "dev";
  private environment: string = process.env.NODE_ENV || "development";

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.service,
      version: this.version,
      environment: this.environment,
      ...(context && { context }),
    };
  }

  private output(entry: LogEntry): void {
    const logString = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(logString);
        break;
      case LogLevel.INFO:
        console.log(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(logString);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.environment === "development") {
      this.output(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    this.output(this.createLogEntry(LogLevel.INFO, message, context));
  }

  warn(message: string, context?: LogContext): void {
    this.output(this.createLogEntry(LogLevel.WARN, message, context));
  }

  error(message: string, context?: LogContext): void {
    this.output(this.createLogEntry(LogLevel.ERROR, message, context));
  }

  fatal(message: string, context?: LogContext): void {
    this.output(this.createLogEntry(LogLevel.FATAL, message, context));
  }

  // HTTP request logging helper
  httpRequest(
    request: Request,
    response: { status: number },
    duration: number
  ): void {
    const context: LogContext = {
      endpoint: new URL(request.url).pathname,
      method: request.method,
      statusCode: response.status,
      duration,
      ip: this.getClientIP(request),
      userAgent: request.headers.get("user-agent") || "unknown",
    };

    const level =
      response.status >= 500
        ? LogLevel.ERROR
        : response.status >= 400
        ? LogLevel.WARN
        : LogLevel.INFO;

    this.output(
      this.createLogEntry(
        level,
        `${request.method} ${context.endpoint} ${response.status}`,
        context
      )
    );
  }

  // Business metric logging
  businessMetric(metric: string, value: number, context?: LogContext): void {
    this.info(`metric.${metric}`, {
      ...context,
      metricValue: value,
      metricName: metric,
    });
  }

  // Security event logging
  securityEvent(event: string, context?: LogContext): void {
    this.warn(`security.${event}`, {
      ...context,
      securityEvent: event,
    });
  }

  private getClientIP(request: Request): string {
    const forwardedFor = request.headers.get("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }

    const realIP = request.headers.get("x-real-ip");
    if (realIP) {
      return realIP;
    }

    return "unknown";
  }
}

// Singleton instance
export const log = new Logger();

// Legacy compatibility (deprecated - migrate to new logger)
export const legacyLog = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    log.info(msg, meta as LogContext),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    log.warn(msg, meta as LogContext),
  error: (msg: string, meta?: Record<string, unknown>) =>
    log.error(msg, meta as LogContext),
};
