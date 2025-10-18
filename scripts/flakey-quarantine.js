#!/usr/bin/env node

/**
 * Flakey Test Quarantine System
 * Kararsız testleri izole eder ve ana raporları temizler
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '../reports');
const QUARANTINE_FILE = path.join(REPORT_DIR, 'flakey-tests.json');

// Flakey test tanımları ve criteria
const FLAKEY_CRITERIA = {
  failure_rate_threshold: 0.2,    // %20 failure rate
  inconsistency_window: 14,       // 14 gün içinde
  min_runs: 5                     // Minimum 5 çalışma
};

class FlakeyTestManager {
  constructor() {
    this.flakeyTests = this.loadFlakeyTests();
    this.recentReports = this.loadRecentReports();
  }

  loadFlakeyTests() {
    if (fs.existsSync(QUARANTINE_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(QUARANTINE_FILE, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Failed to load flakey tests, starting fresh');
        return { tests: [], last_updated: null };
      }
    }
    return { tests: [], last_updated: null };
  }

  loadRecentReports() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - FLAKEY_CRITERIA.inconsistency_window);
    
    const reports = [];
    const files = fs.readdirSync(REPORT_DIR)
      .filter(file => file.startsWith('nightly-report-') && file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, FLAKEY_CRITERIA.inconsistency_window * 2); // Safety margin

    files.forEach(file => {
      try {
        const reportPath = path.join(REPORT_DIR, file);
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const reportDate = new Date(report.date);
        
        if (reportDate >= cutoffDate) {
          reports.push({
            date: report.date,
            integration_tests: {
              passed: report.tests.integration.passed,
              failed: report.tests.integration.failed,
              details: report.tests.integration.details || []
            },
            build_success: report.build.success,
            alerts: report.alerts || []
          });
        }
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}`);
      }
    });

    return reports;
  }

  analyzeFlakeyness() {
    const testResults = {};
    const buildResults = [];

    // Test sonuçlarını analiz et
    this.recentReports.forEach(report => {
      buildResults.push({
        date: report.date,
        success: report.build_success
      });

      // Test detaylarını parse et (basit implementasyon)
      report.integration_tests.details.forEach(detail => {
        const testName = this.extractTestName(detail);
        if (testName) {
          if (!testResults[testName]) {
            testResults[testName] = { runs: [], name: testName };
          }
          testResults[testName].runs.push({
            date: report.date,
            passed: detail.includes('✅') || detail.includes('✓'),
            failed: detail.includes('❌') || detail.includes('✗')
          });
        }
      });
    });

    // Build kararlılığını analiz et
    const buildStats = this.analyzeBuildStability(buildResults);

    // Test kararlılığını analiz et
    const flakeyTests = [];
    Object.values(testResults).forEach(test => {
      if (test.runs.length >= FLAKEY_CRITERIA.min_runs) {
        const failureRate = test.runs.filter(run => run.failed).length / test.runs.length;
        const passRate = test.runs.filter(run => run.passed).length / test.runs.length;
        
        // Flakey kriterini kontrol et: düzensiz sonuçlar
        if (failureRate > 0 && failureRate < 1 && 
            failureRate >= FLAKEY_CRITERIA.failure_rate_threshold) {
          flakeyTests.push({
            name: test.name,
            runs: test.runs.length,
            failure_rate: failureRate,
            pass_rate: passRate,
            last_failure: test.runs.filter(r => r.failed).slice(-1)[0]?.date,
            inconsistent: true,
            quarantined_at: new Date().toISOString()
          });
        }
      }
    });

    return {
      flakey_tests: flakeyTests,
      build_stability: buildStats,
      analysis_period: {
        days: FLAKEY_CRITERIA.inconsistency_window,
        reports_analyzed: this.recentReports.length,
        criteria: FLAKEY_CRITERIA
      }
    };
  }

  analyzeBuildStability(buildResults) {
    const totalBuilds = buildResults.length;
    const successfulBuilds = buildResults.filter(b => b.success).length;
    const failedBuilds = totalBuilds - successfulBuilds;
    
    const successRate = totalBuilds > 0 ? (successfulBuilds / totalBuilds) : 0;
    
    // Consecutive failure detection
    let maxConsecutiveFailures = 0;
    let currentConsecutiveFailures = 0;
    
    buildResults.forEach(build => {
      if (!build.success) {
        currentConsecutiveFailures++;
        maxConsecutiveFailures = Math.max(maxConsecutiveFailures, currentConsecutiveFailures);
      } else {
        currentConsecutiveFailures = 0;
      }
    });

    return {
      total_builds: totalBuilds,
      successful_builds: successfulBuilds,
      failed_builds: failedBuilds,
      success_rate: successRate,
      max_consecutive_failures: maxConsecutiveFailures,
      stable: successRate >= 0.95 && maxConsecutiveFailures <= 2
    };
  }

  extractTestName(testDetail) {
    // Basit test adı çıkarma - gerçek implementasyonda daha sophisticated olabilir
    const patterns = [
      /should\s+([^✅❌]+)/,
      /test[:\s]+([^✅❌]+)/,
      /([A-Za-z\s]+)(?:\s+✅|\s+❌)/
    ];

    for (const pattern of patterns) {
      const match = testDetail.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }
    
    return null;
  }

  updateQuarantine(analysis) {
    const updatedQuarantine = {
      last_updated: new Date().toISOString(),
      analysis_period: analysis.analysis_period,
      build_stability: analysis.build_stability,
      tests: analysis.flakey_tests,
      metrics: {
        total_quarantined: analysis.flakey_tests.length,
        noise_reduction: this.calculateNoiseReduction(analysis.flakey_tests),
        main_test_stability: analysis.build_stability.stable
      }
    };

    fs.writeFileSync(QUARANTINE_FILE, JSON.stringify(updatedQuarantine, null, 2));
    fs.chmodSync(QUARANTINE_FILE, 0o444); // Salt-okunur

    return updatedQuarantine;
  }

  calculateNoiseReduction(flakeyTests) {
    // Karantinaya alınmış testlerden kaynaklanan gürültü azalması hesaplama
    const totalFlakeyRuns = flakeyTests.reduce((sum, test) => sum + test.runs, 0);
    const estimatedFalseFailures = flakeyTests.reduce((sum, test) => 
      sum + (test.runs * test.failure_rate), 0);
    
    return {
      quarantined_tests: flakeyTests.length,
      estimated_false_failures_prevented: Math.round(estimatedFalseFailures),
      noise_reduction_percentage: totalFlakeyRuns > 0 ? 
        (estimatedFalseFailures / totalFlakeyRuns * 100).toFixed(1) : 0
    };
  }

  generateReport() {
    console.log('🧪 Flakey Test Quarantine Analysis');
    console.log('='.repeat(50));
    
    const analysis = this.analyzeFlakeyness();
    const quarantine = this.updateQuarantine(analysis);
    
    console.log(`📊 Analysis Period: ${analysis.analysis_period.days} days`);
    console.log(`📈 Reports Analyzed: ${analysis.analysis_period.reports_analyzed}`);
    console.log(`🏗️  Build Stability: ${analysis.build_stability.stable ? '✅ STABLE' : '⚠️ UNSTABLE'}`);
    console.log(`   Success Rate: ${(analysis.build_stability.success_rate * 100).toFixed(1)}%`);
    console.log(`   Max Consecutive Failures: ${analysis.build_stability.max_consecutive_failures}`);
    
    console.log(`\n🔍 Flakey Test Detection:`);
    if (analysis.flakey_tests.length === 0) {
      console.log('   ✅ No flakey tests detected');
    } else {
      console.log(`   ⚠️  ${analysis.flakey_tests.length} flakey tests quarantined`);
      analysis.flakey_tests.forEach(test => {
        console.log(`      ${test.name}: ${(test.failure_rate * 100).toFixed(1)}% failure rate`);
      });
    }

    console.log(`\n📉 Noise Reduction:`);
    console.log(`   Prevented False Failures: ${quarantine.metrics.noise_reduction.estimated_false_failures_prevented}`);
    console.log(`   Noise Reduction: ${quarantine.metrics.noise_reduction.noise_reduction_percentage}%`);
    
    console.log(`\n📁 Quarantine file: ${QUARANTINE_FILE}`);
    
    return quarantine;
  }
}

// Script execution
if (require.main === module) {
  const manager = new FlakeyTestManager();
  const result = manager.generateReport();
  
  process.exit(result.metrics.main_test_stability ? 0 : 1);
}

module.exports = FlakeyTestManager;
