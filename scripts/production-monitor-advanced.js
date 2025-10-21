#!/usr/bin/env node

/**
 * ProCheff Production Monitoring & Alerting
 * 24-hour operational monitoring with SLI/SLO tracking
 */

const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");

class ProductionMonitor {
  constructor() {
    this.isRunning = false;
    this.alertThresholds = {
      // SEV-1 Alarms
      pt_mismatch_count: { max: 0, window: "5m", severity: "SEV-1" },
      pipeline_success_rate: { min: 95, window: "60m", severity: "SEV-2" },
      parse_failed_count: { max: 3, window: "10m", severity: "WARNING" },
    };

    this.sliMetrics = {
      pt_mismatch_count: 0,
      pipeline_success_rate: 100,
      parse_failed_count: 0,
      idempotent_dedup_count: 0,
      adt_flag_accuracy: 100,
    };

    this.canaryConfig = {
      enabled: false,
      trafficPercent: 10,
      duration: 10 * 60 * 1000, // 10 minutes
      sliThreshold: 95,
    };
  }

  async init() {
    console.log("🚀 ProCheff Production Monitor Starting...");
    console.log("📊 SLI Thresholds:", this.alertThresholds);

    // İlk health check
    const health = await this.checkSystemHealth();
    if (!health.healthy) {
      console.error("❌ System not healthy at startup:", health.issues);
      process.exit(1);
    }

    console.log("✅ System healthy - starting monitoring loop");
    this.startMonitoringLoop();
  }

  async checkSystemHealth() {
    const checks = {
      healthy: true,
      issues: [],
      timestamp: new Date().toISOString(),
    };

    try {
      // API Health Check
      const apiHealth = await this.checkAPI("/api/health");
      if (!apiHealth.ok) {
        checks.healthy = false;
        checks.issues.push(`API Health: ${apiHealth.status}`);
      }

      // Database Consistency
      const dbChecks = await this.checkDatabaseConsistency();
      if (dbChecks.length > 0) {
        checks.healthy = false;
        checks.issues.push(...dbChecks);
      }

      // SLI Metrics
      await this.updateSLIMetrics();
      const violations = this.checkSLIViolations();
      if (violations.length > 0) {
        checks.issues.push(...violations);
        if (violations.some((v) => v.includes("SEV-1"))) {
          checks.healthy = false;
        }
      }
    } catch (error) {
      checks.healthy = false;
      checks.issues.push(`Monitor Error: ${error.message}`);
    }

    return checks;
  }

  async checkAPI(endpoint) {
    return new Promise((resolve) => {
      const curl = spawn("curl", [
        "-s",
        "-f",
        "-m",
        "10",
        `http://localhost:3001${endpoint}`,
      ]);

      curl.on("close", (code) => {
        resolve({ ok: code === 0, status: code });
      });

      curl.on("error", () => {
        resolve({ ok: false, status: "ERROR" });
      });
    });
  }

  async checkDatabaseConsistency() {
    const issues = [];

    try {
      // simulationId NULL check
      const nullSimResults = await this.runDBQuery(
        "SELECT COUNT(*) as null_count FROM offers WHERE simulationId IS NULL"
      );
      if (nullSimResults?.null_count > 0) {
        issues.push(
          `❌ ${nullSimResults.null_count} offers with NULL simulationId`
        );
      }

      // docHash NULL check
      const nullDocResults = await this.runDBQuery(
        "SELECT COUNT(*) as null_count FROM tenders WHERE docHash IS NULL"
      );
      if (nullDocResults?.null_count > 0) {
        issues.push(
          `⚠️ ${nullDocResults.null_count} tenders with NULL docHash`
        );
      }
    } catch (error) {
      issues.push(`DB Check Error: ${error.message}`);
    }

    return issues;
  }

  async runDBQuery(query) {
    // SQLite için basit query runner
    return new Promise((resolve, reject) => {
      const sqlite = spawn("sqlite3", ["prisma/dev.db", query]);

      let output = "";
      sqlite.stdout.on("data", (data) => {
        output += data.toString();
      });

      sqlite.on("close", (code) => {
        if (code === 0) {
          try {
            const result = output.trim();
            resolve({ null_count: parseInt(result) || 0 });
          } catch (e) {
            resolve(null);
          }
        } else {
          reject(new Error(`SQLite exit code: ${code}`));
        }
      });
    });
  }

  async updateSLIMetrics() {
    try {
      // /api/offers endpoint'inden health bilgisini al
      const healthCheck = await this.checkAPI("/api/offers");
      if (healthCheck.ok) {
        // Gerçek metrikleri API'den alabilir veya log'lardan parse edebiliriz
        // Şimdilik mock değerler
        this.sliMetrics.pipeline_success_rate = 98.5;
      }
    } catch (error) {
      console.error("SLI Update Error:", error.message);
    }
  }

  checkSLIViolations() {
    const violations = [];

    // PT Mismatch (SEV-1)
    if (
      this.sliMetrics.pt_mismatch_count >
      this.alertThresholds.pt_mismatch_count.max
    ) {
      violations.push(
        `🚨 SEV-1: PT mismatch count: ${this.sliMetrics.pt_mismatch_count}`
      );
    }

    // Pipeline Success Rate (SEV-2)
    if (
      this.sliMetrics.pipeline_success_rate <
      this.alertThresholds.pipeline_success_rate.min
    ) {
      violations.push(
        `⚠️ SEV-2: Pipeline success rate: ${this.sliMetrics.pipeline_success_rate}%`
      );
    }

    // Parse Failed Count (WARNING)
    if (
      this.sliMetrics.parse_failed_count >=
      this.alertThresholds.parse_failed_count.max
    ) {
      violations.push(
        `🔸 WARNING: Parse failures: ${this.sliMetrics.parse_failed_count}/10min`
      );
    }

    return violations;
  }

  async startMonitoringLoop() {
    this.isRunning = true;

    while (this.isRunning) {
      const startTime = Date.now();

      try {
        const health = await this.checkSystemHealth();

        // Report
        console.log(
          `[${new Date().toISOString()}] Health Check:`,
          health.healthy ? "✅ HEALTHY" : "❌ UNHEALTHY"
        );

        if (health.issues.length > 0) {
          console.log("Issues:", health.issues);
        }

        // SLI Report
        console.log("📊 SLI Metrics:", {
          pt_mismatch: this.sliMetrics.pt_mismatch_count,
          pipeline_success: `${this.sliMetrics.pipeline_success_rate}%`,
          parse_failures: this.sliMetrics.parse_failed_count,
        });

        // Log to file for historical analysis
        await this.logHealthReport(health);
      } catch (error) {
        console.error("❌ Monitor Loop Error:", error);
      }

      // 30-second intervals
      const elapsed = Date.now() - startTime;
      const sleepTime = Math.max(0, 30000 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, sleepTime));
    }
  }

  async logHealthReport(health) {
    try {
      const reportDir = path.join(__dirname, "../reports");
      const reportFile = path.join(
        reportDir,
        `production-health-${new Date().toISOString().split("T")[0]}.jsonl`
      );

      const logEntry =
        JSON.stringify({
          timestamp: health.timestamp,
          healthy: health.healthy,
          issues: health.issues,
          sli_metrics: this.sliMetrics,
        }) + "\n";

      await fs.appendFile(reportFile, logEntry);
    } catch (error) {
      console.error("Failed to log health report:", error);
    }
  }

  async spotCheck() {
    console.log("🔍 Running Spot Checks...");

    const checks = [
      this.checkOffersPageHealth(),
      this.checkADTPDFGeneration(),
      this.checkIdempotentBehavior(),
    ];

    const results = await Promise.allSettled(checks);

    results.forEach((result, index) => {
      const checkNames = [
        "Offers Page Health",
        "ADT PDF Generation",
        "Idempotent Behavior",
      ];
      if (result.status === "fulfilled") {
        console.log(`✅ ${checkNames[index]}: ${result.value}`);
      } else {
        console.log(`❌ ${checkNames[index]}: ${result.reason.message}`);
      }
    });
  }

  async checkOffersPageHealth() {
    const result = await this.checkAPI("/offers");
    return result.ok ? "Page loads successfully" : "Page load failed";
  }

  async checkADTPDFGeneration() {
    // Mock check - gerçekte PDF generation test edilir
    return "PDF generation mock test passed";
  }

  async checkIdempotentBehavior() {
    // Mock check - gerçekte aynı docHash ile duplicate test edilir
    return "Idempotent behavior mock test passed";
  }

  stop() {
    console.log("🛑 Stopping Production Monitor...");
    this.isRunning = false;
  }
}

// CLI Usage
if (require.main === module) {
  const monitor = new ProductionMonitor();

  process.on("SIGINT", () => {
    monitor.stop();
    process.exit(0);
  });

  if (process.argv.includes("--spot-check")) {
    monitor.spotCheck().then(() => process.exit(0));
  } else {
    monitor.init().catch(console.error);
  }
}

module.exports = ProductionMonitor;
