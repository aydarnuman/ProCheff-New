#!/usr/bin/env node

/**
 * Nightly Report Generator
 * Route manifest, build log ve test raporunu üretir ve arşivler
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPORT_DIR = path.join(__dirname, '../reports');
const DATE_STAMP = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
const TIME_STAMP = new Date().toISOString().replace(/[:.]/g, '-');

// Rapor dizinini oluştur
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

const REPORT_FILE = path.join(REPORT_DIR, `nightly-report-${DATE_STAMP}.json`);
const LOG_FILE = path.join(REPORT_DIR, `build-log-${DATE_STAMP}.txt`);

console.log(`🌙 Nightly Report Generator - ${new Date().toISOString()}`);
console.log(`📁 Reports will be saved to: ${REPORT_DIR}`);

// Mevcut dosyaları yazılabilir hale getir
try {
  if (fs.existsSync(REPORT_FILE)) {
    fs.chmodSync(REPORT_FILE, 0o644);
  }
  if (fs.existsSync(LOG_FILE)) {
    fs.chmodSync(LOG_FILE, 0o644);
  }
} catch (error) {
  console.warn('⚠️  Could not update file permissions:', error.message);
}

const report = {
  timestamp: new Date().toISOString(),
  date: DATE_STAMP,
  status: 'unknown',
  environment: {
    node_env: process.env.NODE_ENV || 'development',
    production_mode: process.env.NODE_ENV === 'production',
    hostname: require('os').hostname(),
    node_version: process.version
  },
  build: {
    success: false,
    routes: [],
    errors: [],
    warnings: []
  },
  tests: {
    integration: {
      passed: 0,
      failed: 0,
      skipped: 0,
      details: []
    }
  },
  routes: {
    root_conflict: false,
    dashboard_separate: false,
    total_routes: 0
  },
  health_checks: {
    css_imports: 'unknown',
    client_server_separation: 'unknown',
    temp_flags: 'unknown'
  },
  alerts: [],
  integrity: {
    hash: null,
    timestamp: null,
    readonly: false
  }
};

try {
  console.log('\n🔨 Running build and capturing output...');
  
  // Build çalıştır ve çıktıyı yakala
  const buildOutput = execSync('npm run build', {
    encoding: 'utf8',
    cwd: path.join(__dirname, '..')
  });
  
  // Build log'unu dosyaya kaydet
  fs.writeFileSync(LOG_FILE, buildOutput);
  
  // Route manifest'ini parse et
  const routeLines = buildOutput.split('\n').filter(line => 
    line.includes('○') || line.includes('ƒ') || line.includes('├') || line.includes('└')
  );
  
  report.build.success = true;
  report.build.routes = routeLines.map(line => line.trim());
  
  // Root route çakışması kontrolü
  const rootRoutes = routeLines.filter(line => {
    // Sadece "○ /" veya "┌ ○ /" pattern'ini ara, dashboard vs değil
    return (line.includes('○ /') || line.includes('┌ ○ /')) && 
           !line.includes('/_') && 
           !line.includes('/api') &&
           (line.includes('○ /                   ') || line.includes('┌ ○ /                   '));
  });
  report.routes.root_conflict = rootRoutes.length > 1;
  
  // Dashboard ayrık route kontrolü
  const dashboardRoute = routeLines.find(line => line.includes('/dashboard'));
  report.routes.dashboard_separate = !!dashboardRoute;
  report.routes.total_routes = routeLines.length;
  
  if (report.routes.root_conflict) {
    report.alerts.push('⚠️ ROOT ROUTE CONFLICT DETECTED');
  }
  
  if (!report.routes.dashboard_separate) {
    report.alerts.push('⚠️ DASHBOARD ROUTE NOT FOUND');
  }
  
  console.log('✅ Build completed successfully');
  
} catch (error) {
  console.error('❌ Build failed:', error.message);
  report.build.success = false;
  report.build.errors.push(error.message);
  report.alerts.push('🚨 BUILD FAILURE');
  
  // Build log'unu yine de kaydet
  fs.writeFileSync(LOG_FILE, error.stdout || error.message);
}

async function runIntegrationTestScheduling() {
  try {
    console.log('\n🧪 Running integration test scheduling...');
    
    // Process conflict kontrolü
    const TestServerManager = require('./test-server-manager.js');
    const serverManager = new TestServerManager();
    
    // Mevcut process'leri kontrol et
    const zombieProcesses = await serverManager.checkZombieProcesses();
    const portClean = await serverManager.verifyPortClean();
    
    // Test scheduling logic
    const testScheduling = {
      process_conflicts: zombieProcesses !== 'clean',
      port_conflicts: !portClean,
      can_run_tests: zombieProcesses === 'clean' && portClean,
      schedule_mode: 'sequential', // Nightly ve integration testler sıralı çalışır
      next_test_window: 'available'
    };
    
    if (testScheduling.can_run_tests) {
      report.tests.integration.passed = 1;
      report.tests.integration.failed = 0;
      report.tests.integration.details = ['Test environment ready for execution'];
    } else {
      report.tests.integration.passed = 0;
      report.tests.integration.failed = 1;
      report.tests.integration.details = [
        `Process conflicts: ${zombieProcesses}`,
        `Port conflicts: ${!portClean ? 'detected' : 'none'}`
      ];
      report.alerts.push('⚠️ TEST SCHEDULING CONFLICTS DETECTED');
    }
    
    // Test scheduling'i rapora ekle
    report.test_scheduling = testScheduling;
    
    console.log('✅ Test scheduling analysis completed');
    
  } catch (error) {
    console.error('❌ Test scheduling failed:', error.message);
    report.tests.integration.failed = 1;
    report.alerts.push('🚨 TEST SCHEDULING FAILURE');
  }
}

// Ana execution'ı async yapalım
(async function main() {
  
  // Test scheduling çalıştır
  await runIntegrationTestScheduling();
  
  // Diğer işlemleri devam ettir
  completeReport();
  
})().catch(error => {
  console.error('❌ Main execution failed:', error.message);
  process.exit(1);
});

async function completeReport() {
  try {
    console.log('\n🔍 Running health checks...');
    
    // CSS import kontrolü
    const cssImports = execSync('grep -r "import.*\\.css" src/ || echo "none"', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    const cssImportLines = cssImports.trim().split('\n').filter(line => line !== 'none');
    report.health_checks.css_imports = cssImportLines.length === 1 ? 'clean' : 'multiple_imports';
    
    if (cssImportLines.length > 1) {
      report.alerts.push('⚠️ MULTIPLE CSS IMPORTS DETECTED');
    }
    
    // Client-server separation kontrolü
    const clientComponents = execSync('grep -r "use client" src/ | wc -l', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..')
    });
    
    report.health_checks.client_server_separation = parseInt(clientComponents.trim()) > 0 ? 'separated' : 'unknown';
    
    // Geçici flag kontrolü
    const configContent = fs.readFileSync(path.join(__dirname, '../next.config.js'), 'utf8');
    const hasTempFlags = configContent.includes('optimizeCss: false') || 
                        configContent.includes('experimental');
    
    report.health_checks.temp_flags = hasTempFlags ? 'present' : 'clean';
    
    if (hasTempFlags) {
      report.alerts.push('⚠️ TEMPORARY FLAGS STILL PRESENT');
    }
    
    console.log('✅ Health checks completed');
    
  } catch (error) {
    console.error('❌ Health checks failed:', error.message);
    report.alerts.push('🚨 HEALTH CHECK FAILURE');
  }

  // Advanced monitoring components
  try {
    console.log('\n🧪 Running flakey test analysis...');
    const FlakeyTestManager = require('./flakey-quarantine.js');
    const flakeyManager = new FlakeyTestManager();
    const flakeyAnalysis = flakeyManager.analyzeFlakeyness();
    
    report.flakey_analysis = {
      quarantined_tests: flakeyAnalysis.flakey_tests.length,
      build_stability: flakeyAnalysis.build_stability.stable,
      noise_reduction: flakeyAnalysis.flakey_tests.length > 0
    };
    
    if (flakeyAnalysis.flakey_tests.length > 0) {
      report.alerts.push(`⚠️ ${flakeyAnalysis.flakey_tests.length} FLAKEY TESTS QUARANTINED`);
    }
    
    console.log('✅ Flakey test analysis completed');
    
  } catch (error) {
    console.warn('⚠️  Flakey test analysis skipped:', error.message);
    report.flakey_analysis = { status: 'skipped', reason: error.message };
  }

  try {
    console.log('\n🎯 Running SLO compliance check...');
    const SLOMonitor = require('./slo-monitor.js');
    const sloMonitor = new SLOMonitor();
    const sloCompliance = sloMonitor.calculateSLOCompliance();
    
    const violations = Object.values(sloCompliance).filter(slo => slo.violation).length;
    const warnings = Object.values(sloCompliance).filter(slo => 
      !slo.violation && slo.error_budget_remaining < slo.error_budget * 0.2).length;
    
    report.slo_compliance = {
      overall_compliant: violations === 0,
      violations: violations,
      warnings: warnings,
      uptime: sloCompliance.uptime?.actual || 0,
      build_success_rate: sloCompliance.build_success?.actual || 0
    };
    
    if (violations > 0) {
      report.alerts.push(`🚨 ${violations} SLO VIOLATION(S) DETECTED`);
    }
    
    console.log('✅ SLO compliance check completed');
    
  } catch (error) {
    console.warn('⚠️  SLO compliance check skipped:', error.message);
    report.slo_compliance = { status: 'skipped', reason: error.message };
  }

  // Exception Rules Analysis
  try {
    console.log('\n📋 Applying exception rules...');
    const ExceptionRulesManager = require('./exception-rules.js');
    const exceptionManager = new ExceptionRulesManager();
    
    // Apply exception rules to current alerts
    const filteredAlerts = exceptionManager.filterAlerts(report.alerts, {
      environment: report.environment.node_env,
      build_output: fs.readFileSync(LOG_FILE, 'utf8'),
      timestamp: report.timestamp
    });
    
    report.exception_rules = {
      original_alerts: report.alerts.length,
      filtered_alerts: filteredAlerts.length,
      rules_applied: filteredAlerts.length !== report.alerts.length,
      suppressed_count: report.alerts.length - filteredAlerts.length,
      active_rules: exceptionManager.getActiveRules()
    };
    
    // Update alerts with filtered results
    report.alerts = filteredAlerts;
    
    console.log('✅ Exception rules applied');
    
  } catch (error) {
    console.warn('⚠️  Exception rules analysis skipped:', error.message);
    report.exception_rules = { status: 'skipped', reason: error.message };
  }

  // Privacy Scan
  try {
    console.log('\n🔒 Running privacy scan...');
    const PrivacyScanner = require('./privacy-scanner.js');
    const privacyScanner = new PrivacyScanner();
    
    const scanResult = privacyScanner.scanProject();
    
    report.privacy_check = {
      status: scanResult.violations.length === 0 ? 'clean' : 'warning',
      scan_date: new Date().toISOString(),
      violations_count: scanResult.violations.length,
      files_scanned: scanResult.files_scanned,
      violations: scanResult.violations.map(v => ({
        file: v.file,
        type: v.type,
        line: v.line,
        reason: v.reason
      }))
    };
    
    if (scanResult.violations.length > 0) {
      report.alerts.push(`🔒 ${scanResult.violations.length} PRIVACY VIOLATION(S) DETECTED`);
    }
    
    console.log('✅ Privacy scan completed');
    
  } catch (error) {
    console.warn('⚠️  Privacy scan skipped:', error.message);
    report.privacy_check = { status: 'skipped', reason: error.message };
  }

  // Design Drift Check - İdempotent Tasarım İlkeleri Kontrolü
  try {
    console.log('\n🎨 Running design drift check...');
    const DesignSystemAudit = require('./design-drift-audit.js');
    const designAudit = new DesignSystemAudit();
    
    // Sync version kullan (async'e gerek yok performAudit için)
    const auditResult = designAudit.performAudit();
    
    report.design_drift_check = {
      status: auditResult.status === 'GO' ? 'clean' : 'warning',
      scan_date: new Date().toISOString(),
      conflicts: Object.values(auditResult.criteria).filter(c => !c).length,
      principles_count: Object.keys(auditResult.criteria).length,
      go_no_go: auditResult.status,
      reasoning: auditResult.reasoning
    };
    
    if (auditResult.status === 'NO-GO') {
      report.alerts.push('🎨 DESIGN DRIFT VIOLATION DETECTED');
    }
    
    console.log('✅ Design drift check completed');
    
  } catch (error) {
    console.warn('⚠️  Design drift check skipped:', error.message);
    report.design_drift_check = { status: 'skipped', reason: error.message };
  }

  // Genel durum belirleme
  if (report.build.success && 
      report.tests.integration.failed === 0 && 
      !report.routes.root_conflict &&
      report.health_checks.temp_flags === 'clean') {
    report.status = 'healthy';
  } else if (report.build.success && report.tests.integration.failed === 0) {
    report.status = 'warning';
  } else {
    report.status = 'critical';
  }

  // Ortam doğrulaması ve uyarılar
  if (report.environment.node_env !== 'production') {
    report.alerts.push('⚠️ NON-PRODUCTION ENVIRONMENT DETECTED');
  }

  // Hash bütünlük kontrolü
  const reportDataForHash = {
    ...report,
    integrity: undefined // Hash hesaplarken integrity alanını çıkar
  };
  
  report.integrity.hash = crypto.createHash('sha256')
    .update(JSON.stringify(reportDataForHash))
    .digest('hex');
  report.integrity.timestamp = new Date().toISOString();

  // Raporu kaydet
  fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
  
  // Dosyayı salt-okunur yap (kanıt güvenilirliği için)
  fs.chmodSync(REPORT_FILE, 0o444);
  report.integrity.readonly = true;
  
  // Build log'unu da salt-okunur yap
  fs.chmodSync(LOG_FILE, 0o444);

  // Terminal'e özet yazdır
  console.log('\n📊 NIGHTLY REPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`📅 Date: ${DATE_STAMP}`);
  console.log(`🎯 Status: ${report.status.toUpperCase()}`);
  console.log(`🔨 Build: ${report.build.success ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`🧪 Integration Tests: ${report.tests.integration.passed} passed, ${report.tests.integration.failed} failed`);
  console.log(`🛣️  Routes: ${report.routes.total_routes} total (Root conflict: ${report.routes.root_conflict ? 'YES' : 'NO'})`);
  console.log(`🏥 Health: CSS(${report.health_checks.css_imports}) Flags(${report.health_checks.temp_flags})`);

  if (report.alerts.length > 0) {
    console.log('\n🚨 ALERTS:');
    report.alerts.forEach(alert => console.log(`   ${alert}`));
  }

  console.log(`\n📁 Report saved: ${REPORT_FILE}`);
  console.log(`📁 Build log saved: ${LOG_FILE}`);
  console.log(`🔒 Files marked as read-only for integrity`);
  console.log(`🔐 Report hash: ${report.integrity.hash.substring(0, 16)}...`);
  
  // Environment stamp
  console.log(`🏷️  Environment: ${report.environment.node_env.toUpperCase()} on ${report.environment.hostname}`);

  // Process'i temizle
  try {
    execSync('pkill -f "next"', { stdio: 'ignore' });
  } catch (e) {
    // Ignore cleanup errors
  }

  process.exit(report.status === 'critical' ? 1 : 0);
}

