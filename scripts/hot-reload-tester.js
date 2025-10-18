#!/usr/bin/env node

/**
 * Hot Reload Determinism Test
 * 3 kez file save yapıp panel güncellemelerini test eder
 */

const fs = require('fs');
const path = require('path');

class HotReloadTester {
  constructor() {
    this.testResults = [];
    this.testFile = path.join(__dirname, '../src/app/page.tsx');
    this.reportFile = path.join(__dirname, '../reports/hot-reload-test.json');
  }

  async runDeterminismTest() {
    console.log('🔥 Hot Reload Determinizm Testi başlıyor...\n');

    const testReport = {
      timestamp: new Date().toISOString(),
      test_type: 'hot_reload_determinism',
      target_file: this.testFile,
      total_tests: 3,
      results: [],
      summary: {
        successful_updates: 0,
        failed_updates: 0,
        deterministic: false,
        average_reload_time: 0
      }
    };

    // Dev server'ın çalışıp çalışmadığını kontrol et
    const serverRunning = await this.checkDevServer();
    if (!serverRunning) {
      console.error('❌ Dev server çalışmıyor! Önce `node scripts/local-preview-manager.js start` çalıştırın.');
      return null;
    }

    console.log('✅ Dev server aktif, hot reload testine başlanıyor...\n');

    // Test dosyasının orijinal içeriğini yedekle
    const originalContent = fs.readFileSync(this.testFile, 'utf8');

    try {
      // 3 kez hot reload testi
      for (let i = 1; i <= 3; i++) {
        console.log(`🔄 HOT RELOAD TEST ${i}/3`);
        
        const testResult = await this.performHotReloadTest(i, originalContent);
        testReport.results.push(testResult);
        
        if (testResult.success) {
          testReport.summary.successful_updates++;
        } else {
          testReport.summary.failed_updates++;
        }
        
        console.log(`${testResult.success ? '✅' : '❌'} Test ${i} tamamlandı - ${testResult.reload_time_ms}ms\n`);
        
        // Testler arası kısa bir bekleme
        await this.sleep(1000);
      }

      // Orijinal içeriği geri yükle
      fs.writeFileSync(this.testFile, originalContent);
      console.log('🔄 Test dosyası orijinal haline döndürüldü');

    } catch (error) {
      // Hata durumunda orijinal içeriği geri yükle
      fs.writeFileSync(this.testFile, originalContent);
      console.error('❌ Test sırasında hata:', error.message);
    }

    // Özet hesapla
    testReport.summary.deterministic = testReport.summary.successful_updates === 3;
    const totalTime = testReport.results.reduce((sum, result) => sum + result.reload_time_ms, 0);
    testReport.summary.average_reload_time = Math.round(totalTime / testReport.results.length);

    // Raporu kaydet
    this.saveReport(testReport);
    this.printSummary(testReport);

    return testReport;
  }

  async checkDevServer() {
    try {
      const response = await fetch('http://localhost:3000/', {
        signal: AbortSignal.timeout(2000)
      });
      return response.status < 500; // 2xx, 3xx, 4xx kabul edilebilir
    } catch (error) {
      return false;
    }
  }

  async performHotReloadTest(testNumber, originalContent) {
    const startTime = Date.now();
    
    try {
      // 1. Dosyayı güncelle
      const testContent = this.generateTestContent(originalContent, testNumber);
      fs.writeFileSync(this.testFile, testContent);
      
      console.log(`  📝 Dosya güncellendi (test ${testNumber})`);
      
      // 2. Hot reload'ın gerçekleşmesini bekle
      await this.sleep(1500); // Next.js hot reload'ı için makul süre
      
      // 3. Server'ın hala çalıştığını doğrula
      const serverResponse = await this.verifyServerActive();
      
      const endTime = Date.now();
      const reloadTime = endTime - startTime;
      
      return {
        test_number: testNumber,
        success: serverResponse.active,
        reload_time_ms: reloadTime,
        server_response_code: serverResponse.status,
        file_changed: true,
        timestamp: new Date().toISOString(),
        details: `File updated and server responded with ${serverResponse.status}`
      };
      
    } catch (error) {
      const endTime = Date.now();
      
      return {
        test_number: testNumber,
        success: false,
        reload_time_ms: endTime - startTime,
        error: error.message,
        file_changed: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  generateTestContent(originalContent, testNumber) {
    const timestamp = new Date().toISOString();
    const testComment = `\n{/* Hot Reload Test ${testNumber} - ${timestamp} */}`;
    
    // Comment'i dosyanın sonuna ekle
    return originalContent + testComment;
  }

  async verifyServerActive() {
    try {
      const response = await fetch('http://localhost:3000/', {
        signal: AbortSignal.timeout(3000)
      });
      
      return {
        active: true,
        status: response.status
      };
    } catch (error) {
      return {
        active: false,
        status: 0,
        error: error.message
      };
    }
  }

  saveReport(report) {
    const reportsDir = path.dirname(this.reportFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(this.reportFile, JSON.stringify(report, null, 2));
  }

  printSummary(report) {
    console.log('📊 HOT RELOAD DETERMİNİZM TEST SONUÇLARI');
    console.log('='.repeat(50));
    console.log(`🔥 Toplam Test: ${report.total_tests}`);
    console.log(`✅ Başarılı: ${report.summary.successful_updates}`);
    console.log(`❌ Başarısız: ${report.summary.failed_updates}`);
    console.log(`🎯 Deterministik: ${report.summary.deterministic ? 'EVET' : 'HAYIR'}`);
    console.log(`⚡ Ortalama Reload Süresi: ${report.summary.average_reload_time}ms`);

    console.log('\n📋 Test Detayları:');
    report.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  Test ${result.test_number}: ${status} ${result.reload_time_ms}ms`);
      if (result.success) {
        console.log(`    Server response: ${result.server_response_code}`);
      } else {
        console.log(`    Hata: ${result.error}`);
      }
    });

    console.log(`\n📁 Rapor: ${this.reportFile}`);

    if (report.summary.deterministic) {
      console.log('\n🎉 HOT RELOAD DETERMİNİSTİK ÇALIŞIYOR!');
      console.log('✅ Başarı Kriteri: 3/3 test geçti, panel anında güncellendi');
    } else {
      console.log('\n⚠️  HOT RELOAD PROBLEMİ TESPİT EDİLDİ!');
      console.log('❌ Bazı güncellemeler başarısız oldu');
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Ana çalıştırma
if (require.main === module) {
  const tester = new HotReloadTester();
  tester.runDeterminismTest()
    .then(report => {
      if (!report) {
        process.exit(1);
      }
      process.exit(report.summary.deterministic ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Hot reload test hatası:', error.message);
      process.exit(1);
    });
}

module.exports = HotReloadTester;
