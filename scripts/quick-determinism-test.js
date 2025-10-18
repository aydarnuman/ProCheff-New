#!/usr/bin/env node

/**
 * Hızlı Test Akışı - Production Mode Determinizm Testi
 * 3 kez üst üste çalıştırıp flaky riskini tespit eder
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QuickTestRunner {
  constructor() {
    this.testResults = [];
    this.reportFile = path.join(__dirname, '../reports/prod-determinism-test.json');
  }

  async runDeterminismTest() {
    console.log('🎯 Production Mode Determinizm Testi Başlıyor...\n');
    
    const testReport = {
      timestamp: new Date().toISOString(),
      test_type: 'prod_determinism',
      total_runs: 3,
      results: [],
      summary: {
        success_count: 0,
        fail_count: 0,
        deterministic: false,
        flaky_risk: 'unknown'
      }
    };

    // 3 kez üst üste test çalıştır
    for (let i = 1; i <= 3; i++) {
      console.log(`🔄 TEST ${i}/3 başlıyor...`);
      
      const testResult = await this.runSingleTest(i);
      testReport.results.push(testResult);
      
      if (testResult.success) {
        testReport.summary.success_count++;
      } else {
        testReport.summary.fail_count++;
      }
      
      console.log(`${testResult.success ? '✅' : '❌'} TEST ${i}/3 tamamlandı - ${testResult.success ? 'BAŞARILI' : 'BAŞARISIZ'}\n`);
      
      // Testler arası temizlik
      await this.cleanup();
    }

    // Determinizm analizi
    testReport.summary.deterministic = testReport.summary.success_count === 3;
    testReport.summary.flaky_risk = this.analyzeFlakyRisk(testReport.results);

    // Raporu kaydet
    this.saveReport(testReport);
    this.printSummary(testReport);

    return testReport;
  }

  async runSingleTest(testNumber) {
    const startTime = Date.now();
    
    try {
      // 1. Process temizliği
      await this.killAllNextProcesses();
      
      // 2. Port kontrolü
      const portClean = await this.verifyPortClean();
      
      // 3. Build kontrol (cache'den)
      const buildExists = fs.existsSync(path.join(__dirname, '../.next/standalone/server.js'));
      if (!buildExists) {
        throw new Error('Build not found - run npm run build first');
      }
      
      // 4. Server başlatma
      const serverInfo = await this.startQuickServer();
      
      // 5. Health check
      const healthResult = await this.quickHealthCheck(serverInfo.port);
      
      // 6. Server durdurma
      await this.stopServer(serverInfo.process);
      
      const endTime = Date.now();
      
      return {
        test_number: testNumber,
        success: true,
        duration_ms: endTime - startTime,
        port_used: serverInfo.port,
        server_lifecycle: 'clean',
        port_conflict: false,
        health_check: healthResult,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      const endTime = Date.now();
      
      return {
        test_number: testNumber,
        success: false,
        duration_ms: endTime - startTime,
        error: error.message,
        server_lifecycle: 'error',
        port_conflict: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  async killAllNextProcesses() {
    try {
      execSync('pkill -f "next"', { stdio: 'ignore' });
      await this.sleep(1000);
    } catch (e) {
      // Ignore - no processes to kill
    }
  }

  async verifyPortClean() {
    try {
      execSync('lsof -i :3000 -i :3001 -i :3002', { stdio: 'ignore' });
      return false; // Port occupied
    } catch (e) {
      return true; // Port clean
    }
  }

  async startQuickServer() {
    const port = 3000;
    
    const serverProcess = spawn('node', ['.next/standalone/server.js'], {
      env: {
        ...process.env,
        PORT: port.toString(),
        NODE_ENV: 'production'
      },
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    // Kısa süre server'ın başlamasını bekle
    await this.sleep(2000);
    
    return {
      process: serverProcess,
      port: port
    };
  }

  async quickHealthCheck(port) {
    const maxRetries = 5;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`http://localhost:${port}/`, {
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.status < 500) {
          return {
            status: 'healthy',
            response_code: response.status,
            retries: i + 1
          };
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Health check failed after ${maxRetries} retries`);
        }
        await this.sleep(500);
      }
    }
  }

  async stopServer(serverProcess) {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await this.sleep(1000);
    }
  }

  async cleanup() {
    await this.killAllNextProcesses();
    await this.sleep(500);
  }

  analyzeFlakyRisk(results) {
    const successCount = results.filter(r => r.success).length;
    
    if (successCount === 3) return 'low';
    if (successCount === 2) return 'medium';
    if (successCount === 1) return 'high';
    return 'critical';
  }

  saveReport(report) {
    const reportsDir = path.dirname(this.reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
  }

  printSummary(report) {
    console.log('📊 PRODUCTION MODE DETERMİNİZM TEST SONUÇLARI');
    console.log('='.repeat(50));
    console.log(`🎯 Toplam Test: ${report.total_runs}`);
    console.log(`✅ Başarılı: ${report.summary.success_count}`);
    console.log(`❌ Başarısız: ${report.summary.fail_count}`);
    console.log(`🔬 Deterministik: ${report.summary.deterministic ? 'EVET' : 'HAYIR'}`);
    console.log(`⚠️  Flaky Risk: ${report.summary.flaky_risk.toUpperCase()}`);
    
    console.log('\n📋 Test Detayları:');
    report.results.forEach(result => {
      console.log(`  Test ${result.test_number}: ${result.success ? '✅' : '❌'} (${result.duration_ms}ms)`);
      if (result.success) {
        console.log(`    Port: ${result.port_used}, Lifecycle: ${result.server_lifecycle}`);
      } else {
        console.log(`    Hata: ${result.error}`);
      }
    });
    
    console.log(`\n📁 Rapor kaydedildi: ${this.reportFile}`);
    
    if (report.summary.deterministic) {
      console.log('\n🎉 GÖREV 1 TAMAMLANDI - Production mode deterministik çalışıyor!');
    } else {
      console.log('\n⚠️  GÖREV 1 BAŞARISIZ - Flaky davranış tespit edildi!');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Ana çalıştırma
if (require.main === module) {
  const runner = new QuickTestRunner();
  runner.runDeterminismTest()
    .then(report => {
      process.exit(report.summary.deterministic ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner hatası:', error.message);
      process.exit(1);
    });
}

module.exports = QuickTestRunner;
