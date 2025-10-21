// Production PDF Monitoring & Auto-Recovery System
const fs = require("fs");
const path = require("path");
const cron = require("node-cron");
const nodemailer = require("nodemailer");
const { PDFTestRunner } = require("./automated-pdf-tests-clean");

class ProductionMonitor {
  constructor(config = {}) {
    this.config = {
      email: config.email || null,
      slackWebhook: config.slackWebhook || null,
      healthCheckInterval: config.healthCheckInterval || "*/5 * * * *", // Her 5 dakika
      fullTestInterval: config.fullTestInterval || "0 */2 * * *", // 2 saatte bir
      baseUrl: config.baseUrl || "http://localhost:3000",
      alertThreshold: config.alertThreshold || 80, // %80 altında başarı oranı uyarı verir
    };

    this.testRunner = new PDFTestRunner(this.config.baseUrl);
    this.isMonitoring = false;
    this.lastHealthCheck = null;
    this.consecutiveFailures = 0;
    this.maxConsecutiveFailures = 3;
  }

  async sendAlert(level, title, message, details = null) {
    const alertTime = new Date().toISOString();
    const alertData = { level, title, message, details, timestamp: alertTime };

    console.log(`🚨 ${level.toUpperCase()} ALERT: ${title}`);
    console.log(`📝 ${message}`);
    if (details) {
      console.log(`🔍 Detaylar:`, JSON.stringify(details, null, 2));
    }

    // Email notification
    if (this.config.email && this.config.email.smtp) {
      try {
        await this.sendEmailAlert(alertData);
      } catch (error) {
        console.error("Email gönderme hatası:", error.message);
      }
    }

    // Slack notification
    if (this.config.slackWebhook) {
      try {
        await this.sendSlackAlert(alertData);
      } catch (error) {
        console.error("Slack bildirimi hatası:", error.message);
      }
    }

    // Log to file
    this.logAlert(alertData);
  }

  async sendEmailAlert(alertData) {
    const transporter = nodemailer.createTransporter(this.config.email.smtp);

    const mailOptions = {
      from: this.config.email.from,
      to: this.config.email.to,
      subject: `ProCheff PDF Sistemi - ${alertData.level.toUpperCase()} Uyarısı`,
      html: `
        <h2>🚨 ProCheff PDF Analiz Sistemi Uyarısı</h2>
        <p><strong>Seviye:</strong> ${alertData.level.toUpperCase()}</p>
        <p><strong>Başlık:</strong> ${alertData.title}</p>
        <p><strong>Mesaj:</strong> ${alertData.message}</p>
        <p><strong>Zaman:</strong> ${alertData.timestamp}</p>
        ${
          alertData.details
            ? `<p><strong>Detaylar:</strong></p><pre>${JSON.stringify(
                alertData.details,
                null,
                2
              )}</pre>`
            : ""
        }
        <hr>
        <p><small>ProCheff Otomatik İzleme Sistemi</small></p>
      `,
    };

    await transporter.sendMail(mailOptions);
  }

  async sendSlackAlert(alertData) {
    const fetch = require("node-fetch");

    const payload = {
      text: `🚨 ProCheff PDF Sistemi - ${alertData.level.toUpperCase()} Uyarısı`,
      attachments: [
        {
          color: alertData.level === "critical" ? "danger" : "warning",
          fields: [
            { title: "Başlık", value: alertData.title, short: true },
            { title: "Zaman", value: alertData.timestamp, short: true },
            { title: "Mesaj", value: alertData.message, short: false },
          ],
        },
      ],
    };

    await fetch(this.config.slackWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  logAlert(alertData) {
    const alertsPath = path.join(process.cwd(), "logs", "alerts.log");

    if (!fs.existsSync(path.dirname(alertsPath))) {
      fs.mkdirSync(path.dirname(alertsPath), { recursive: true });
    }

    const logLine = `${JSON.stringify(alertData)}\n`;
    fs.appendFileSync(alertsPath, logLine);
  }

  async performHealthCheck() {
    try {
      console.log("🔍 Sistem sağlık kontrolü yapılıyor...");

      const healthData = await this.testRunner.testHealthCheck();
      this.lastHealthCheck = healthData;
      this.consecutiveFailures = 0;

      const successRate =
        healthData.metrics.totalRequests > 0
          ? (healthData.metrics.successfulRequests /
              healthData.metrics.totalRequests) *
            100
          : 100;

      if (healthData.status === "critical") {
        await this.sendAlert(
          "critical",
          "Sistem Kritik Durumda",
          `Sistem sağlığı kritik seviyede. Başarı oranı: %${successRate.toFixed(
            1
          )}`,
          healthData
        );
      } else if (successRate < this.config.alertThreshold) {
        await this.sendAlert(
          "warning",
          "Düşük Başarı Oranı",
          `Sistem başarı oranı %${successRate.toFixed(1)} - Eşik değeri: %${
            this.config.alertThreshold
          }`,
          healthData
        );
      }

      console.log(
        `✅ Sağlık kontrolü tamamlandı. Durum: ${
          healthData.status
        }, Başarı: %${successRate.toFixed(1)}`
      );
    } catch (error) {
      this.consecutiveFailures++;
      console.error("❌ Sağlık kontrolü başarısız:", error.message);

      if (this.consecutiveFailures >= this.maxConsecutiveFailures) {
        await this.sendAlert(
          "critical",
          "Ardışık Sağlık Kontrolü Hataları",
          `${this.consecutiveFailures} ardışık sağlık kontrolü hatası`,
          {
            error: error.message,
            consecutiveFailures: this.consecutiveFailures,
          }
        );
      }
    }
  }

  async performFullTest() {
    try {
      console.log("🧪 Tam sistem testi başlıyor...");

      const report = await this.testRunner.runAllTests();

      const successRate = (report.passedTests / report.totalTests) * 100;

      if (successRate < this.config.alertThreshold) {
        await this.sendAlert(
          "warning",
          "Tam Test Başarısızlığı",
          `Tam sistem testi başarı oranı: %${successRate.toFixed(1)}`,
          report
        );
      }

      // Save report
      const reportPath = path.join(
        process.cwd(),
        "reports",
        `monitoring-${Date.now()}.json`
      );
      if (!fs.existsSync(path.dirname(reportPath))) {
        fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

      console.log(
        `✅ Tam test tamamlandı. Başarı: %${successRate.toFixed(
          1
        )}, Rapor: ${reportPath}`
      );
    } catch (error) {
      console.error("❌ Tam test başarısız:", error.message);
      await this.sendAlert(
        "critical",
        "Tam Test Sistemi Hatası",
        "Otomatik test sistemi çalışmıyor",
        { error: error.message }
      );
    }
  }

  async performAutoRecovery() {
    console.log("🔄 Otomatik kurtarma işlemleri başlıyor...");

    try {
      // 1. Geçici dosyaları temizle
      const tempPath = path.join(process.cwd(), "test", "data");
      if (fs.existsSync(tempPath)) {
        const files = fs.readdirSync(tempPath);
        files.forEach((file) => {
          if (file.startsWith("temp-")) {
            fs.unlinkSync(path.join(tempPath, file));
            console.log(`🗑️ Geçici dosya silindi: ${file}`);
          }
        });
      }

      // 2. Log dosyalarını rotate et
      const logsPath = path.join(process.cwd(), "logs");
      if (fs.existsSync(logsPath)) {
        const logFiles = fs.readdirSync(logsPath);
        logFiles.forEach((file) => {
          const filePath = path.join(logsPath, file);
          const stats = fs.statSync(filePath);
          const fileSizeMB = stats.size / (1024 * 1024);

          if (fileSizeMB > 50) {
            // 50MB üzeri rotate et
            const timestamp = Date.now();
            const newName = `${file}.${timestamp}`;
            fs.renameSync(filePath, path.join(logsPath, newName));
            console.log(`📄 Log dosyası rotate edildi: ${file} -> ${newName}`);
          }
        });
      }

      // 3. Memory cleanup (garbage collection zorla)
      if (global.gc) {
        global.gc();
        console.log("🧹 Garbage collection tetiklendi");
      }

      console.log("✅ Otomatik kurtarma tamamlandı");
    } catch (error) {
      console.error("❌ Otomatik kurtarma hatası:", error.message);
    }
  }

  startMonitoring() {
    if (this.isMonitoring) {
      console.log("⚠️ İzleme zaten aktif");
      return;
    }

    console.log("🚀 ProCheff PDF İzleme Sistemi Başlıyor...");
    console.log(`📊 Sağlık kontrolü: ${this.config.healthCheckInterval}`);
    console.log(`🧪 Tam test: ${this.config.fullTestInterval}`);
    console.log(`⚠️ Uyarı eşiği: %${this.config.alertThreshold}`);

    this.isMonitoring = true;

    // Sağlık kontrolü job'ı
    cron.schedule(this.config.healthCheckInterval, async () => {
      if (this.isMonitoring) {
        await this.performHealthCheck();
      }
    });

    // Tam test job'ı
    cron.schedule(this.config.fullTestInterval, async () => {
      if (this.isMonitoring) {
        await this.performFullTest();
        await this.performAutoRecovery();
      }
    });

    // İlk kontrolü hemen yap
    this.performHealthCheck();

    console.log("✅ İzleme sistemi aktif");
  }

  stopMonitoring() {
    this.isMonitoring = false;
    console.log("⏹️ İzleme sistemi durduruldu");
  }

  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      config: this.config,
    };
  }
}

// CLI kullanımı
if (require.main === module) {
  const monitor = new ProductionMonitor({
    baseUrl: process.env.PROCHEFF_URL || "http://localhost:3000",
    alertThreshold: parseInt(process.env.ALERT_THRESHOLD) || 80,
    email: process.env.SMTP_HOST
      ? {
          smtp: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          },
          from: process.env.EMAIL_FROM,
          to: process.env.EMAIL_TO,
        }
      : null,
    slackWebhook: process.env.SLACK_WEBHOOK_URL || null,
  });

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n👋 Sistem kapatılıyor...");
    monitor.stopMonitoring();
    process.exit(0);
  });

  monitor.startMonitoring();
}

module.exports = { ProductionMonitor };
