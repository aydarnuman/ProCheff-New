#!/usr/bin/env node

/**
 * Upgrade Preview Reporter
 * Sürüm yükseltme denemelerinde ayrı 'yükseltme prova raporu' üretir
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPORT_DIR = path.join(__dirname, '../reports');
const DATE_STAMP = new Date().toISOString().split('T')[0];

class UpgradePreviewReporter {
  constructor(targetVersion = null, packageName = null) {
    this.targetVersion = targetVersion;
    this.packageName = packageName;
    this.reportData = {
      timestamp: new Date().toISOString(),
      date: DATE_STAMP,
      upgrade: {
        package: packageName,
        current_version: this.getCurrentVersion(packageName),
        target_version: targetVersion,
        upgrade_type: this.getUpgradeType(packageName)
      },
      preview: {
        manifest_check: { status: 'unknown', details: [] },
        build_test: { status: 'unknown', details: [] },
        test_suite: { status: 'unknown', details: [] },
        alert_validation: { status: 'unknown', details: [] }
      },
      risk_assessment: {
        level: 'unknown',
        factors: [],
        mitigations: []
      },
      rollback_plan: {
        required: false,
        steps: []
      }
    };
  }

  getCurrentVersion(packageName) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
      
      if (packageName === 'next') {
        return packageJson.dependencies?.next || packageJson.devDependencies?.next || 'unknown';
      } else if (packageName === 'tailwindcss') {
        return packageJson.dependencies?.tailwindcss || packageJson.devDependencies?.tailwindcss || 'unknown';
      }
      
      return packageJson.dependencies?.[packageName] || packageJson.devDependencies?.[packageName] || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  getUpgradeType(packageName) {
    const corePackages = ['next', 'react', 'tailwindcss'];
    const buildPackages = ['webpack', 'vite', 'postcss'];
    const testPackages = ['vitest', 'jest', 'testing-library'];
    
    if (corePackages.includes(packageName)) return 'core';
    if (buildPackages.includes(packageName)) return 'build';
    if (testPackages.includes(packageName)) return 'test';
    
    return 'dependency';
  }

  checkManifest() {
    console.log('📋 Checking manifest compatibility...');
    
    try {
      // Route manifest kontrolü
      const buildOutput = execSync('npm run build 2>&1', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
        timeout: 60000
      });
      
      const routeCount = (buildOutput.match(/Route \(/g) || []).length;
      const hasErrors = buildOutput.includes('Error:') || buildOutput.includes('Failed to');
      const hasWarnings = buildOutput.includes('warn') || buildOutput.includes('deprecated');
      
      this.reportData.preview.manifest_check = {
        status: hasErrors ? 'failed' : (hasWarnings ? 'warning' : 'passed'),
        details: [
          `Routes detected: ${routeCount}`,
          `Build warnings: ${hasWarnings ? 'present' : 'none'}`,
          `Build errors: ${hasErrors ? 'present' : 'none'}`
        ],
        route_count: routeCount,
        build_clean: !hasErrors && !hasWarnings
      };
      
    } catch (error) {
      this.reportData.preview.manifest_check = {
        status: 'failed',
        details: [`Build failed: ${error.message}`],
        route_count: 0,
        build_clean: false
      };
    }
  }

  runBuildTest() {
    console.log('🔨 Running build test...');
    
    try {
      // Clean build test
      execSync('rm -rf .next', { cwd: path.join(__dirname, '..') });
      
      const buildTime = Date.now();
      const buildOutput = execSync('npm run build 2>&1', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
        timeout: 120000
      });
      const buildDuration = Date.now() - buildTime;
      
      const bundleSize = this.getBundleSize();
      const hasOptimizations = buildOutput.includes('optimized') || buildOutput.includes('minified');
      
      this.reportData.preview.build_test = {
        status: 'passed',
        details: [
          `Build time: ${(buildDuration / 1000).toFixed(1)}s`,
          `Bundle size: ${bundleSize}`,
          `Optimizations: ${hasOptimizations ? 'enabled' : 'disabled'}`
        ],
        build_time_ms: buildDuration,
        bundle_size_bytes: this.getBundleSizeBytes(),
        optimizations_enabled: hasOptimizations
      };
      
    } catch (error) {
      this.reportData.preview.build_test = {
        status: 'failed',
        details: [`Build test failed: ${error.message}`],
        build_time_ms: 0,
        bundle_size_bytes: 0,
        optimizations_enabled: false
      };
    }
  }

  runTestSuite() {
    console.log('🧪 Running test suite...');
    
    try {
      // Type check
      const typeCheckOutput = execSync('npm run type-check 2>&1', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..')
      });
      
      const hasTypeErrors = typeCheckOutput.includes('error TS');
      
      // Integration tests
      const testOutput = execSync('npm run test:integration 2>&1', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
        timeout: 60000
      });
      
      const testPassed = testOutput.includes('passed') && !testOutput.includes('failed');
      const testCount = (testOutput.match(/✓/g) || []).length;
      
      this.reportData.preview.test_suite = {
        status: !hasTypeErrors && testPassed ? 'passed' : 'failed',
        details: [
          `Type errors: ${hasTypeErrors ? 'present' : 'none'}`,
          `Integration tests: ${testPassed ? 'passed' : 'failed'}`,
          `Test count: ${testCount}`
        ],
        type_check_clean: !hasTypeErrors,
        integration_tests_passed: testPassed,
        test_count: testCount
      };
      
    } catch (error) {
      this.reportData.preview.test_suite = {
        status: 'failed',
        details: [`Test suite failed: ${error.message}`],
        type_check_clean: false,
        integration_tests_passed: false,
        test_count: 0
      };
    }
  }

  validateAlerts() {
    console.log('🚨 Validating alert system...');
    
    try {
      // Nightly rapor sistemini test et
      const nightlyOutput = execSync('npm run nightly 2>&1', { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '..'),
        timeout: 90000
      });
      
      const reportGenerated = nightlyOutput.includes('Report saved:');
      const alertsWorking = nightlyOutput.includes('ALERTS:') || nightlyOutput.includes('No alerts');
      const hashGenerated = nightlyOutput.includes('Report hash:');
      
      this.reportData.preview.alert_validation = {
        status: reportGenerated && alertsWorking && hashGenerated ? 'passed' : 'failed',
        details: [
          `Report generation: ${reportGenerated ? 'working' : 'failed'}`,
          `Alert system: ${alertsWorking ? 'working' : 'failed'}`,
          `Hash integrity: ${hashGenerated ? 'working' : 'failed'}`
        ],
        nightly_system_working: reportGenerated && alertsWorking && hashGenerated
      };
      
    } catch (error) {
      this.reportData.preview.alert_validation = {
        status: 'failed',
        details: [`Alert validation failed: ${error.message}`],
        nightly_system_working: false
      };
    }
  }

  assessRisk() {
    console.log('⚖️  Assessing upgrade risk...');
    
    const riskFactors = [];
    const mitigations = [];
    
    // Risk faktörlerini değerlendir
    if (this.reportData.preview.manifest_check.status === 'failed') {
      riskFactors.push('Build manifest compatibility issues');
      mitigations.push('Review build configuration before upgrade');
    }
    
    if (this.reportData.preview.build_test.status === 'failed') {
      riskFactors.push('Build process failures');
      mitigations.push('Test build process in isolated environment');
    }
    
    if (this.reportData.preview.test_suite.status === 'failed') {
      riskFactors.push('Test suite compatibility issues');
      mitigations.push('Update test configurations and dependencies');
    }
    
    if (this.reportData.preview.alert_validation.status === 'failed') {
      riskFactors.push('Monitoring system disruption');
      mitigations.push('Verify nightly report system after upgrade');
    }
    
    // Core package risk assessment
    if (this.reportData.upgrade.upgrade_type === 'core') {
      riskFactors.push('Core framework changes may require code updates');
      mitigations.push('Review migration guide and breaking changes');
    }
    
    // Risk level belirleme
    let riskLevel = 'low';
    if (riskFactors.length > 2) {
      riskLevel = 'high';
    } else if (riskFactors.length > 0) {
      riskLevel = 'medium';
    }
    
    // Default mitigations
    if (mitigations.length === 0) {
      mitigations.push('Standard backup and rollback plan');
      mitigations.push('Monitor system for 24h post-upgrade');
    }
    
    this.reportData.risk_assessment = {
      level: riskLevel,
      factors: riskFactors,
      mitigations: mitigations,
      recommendation: this.getRecommendation(riskLevel, riskFactors)
    };
    
    // Rollback plan
    this.reportData.rollback_plan = {
      required: riskLevel !== 'low',
      steps: riskLevel !== 'low' ? [
        'Backup current package.json and package-lock.json',
        'Document current versions',
        'Prepare rollback script',
        'Monitor error logs during upgrade'
      ] : ['Standard git revert capability sufficient']
    };
  }

  getRecommendation(riskLevel, factors) {
    if (riskLevel === 'high') {
      return 'HIGH RISK: Consider staging environment testing before production upgrade';
    } else if (riskLevel === 'medium') {
      return 'MEDIUM RISK: Proceed with caution, monitor closely';
    } else {
      return 'LOW RISK: Safe to proceed with standard procedures';
    }
  }

  getBundleSize() {
    try {
      const nextDir = path.join(__dirname, '../.next');
      if (!fs.existsSync(nextDir)) return 'unknown';
      
      const staticDir = path.join(nextDir, 'static');
      if (!fs.existsSync(staticDir)) return 'unknown';
      
      const output = execSync(`du -sh ${staticDir}`, { encoding: 'utf8' });
      return output.trim().split('\t')[0];
    } catch (error) {
      return 'unknown';
    }
  }

  getBundleSizeBytes() {
    try {
      const nextDir = path.join(__dirname, '../.next');
      if (!fs.existsSync(nextDir)) return 0;
      
      const staticDir = path.join(nextDir, 'static');
      if (!fs.existsSync(staticDir)) return 0;
      
      const output = execSync(`du -s ${staticDir}`, { encoding: 'utf8' });
      return parseInt(output.trim().split('\t')[0]) * 1024; // Convert KB to bytes
    } catch (error) {
      return 0;
    }
  }

  generateReport() {
    console.log('📊 Generating upgrade preview report...');
    
    // Tüm kontrolleri çalıştır
    this.checkManifest();
    this.runBuildTest();
    this.runTestSuite();
    this.validateAlerts();
    this.assessRisk();
    
    // Report'u kaydet
    const reportFile = path.join(REPORT_DIR, `upgrade-preview-${this.packageName}-${DATE_STAMP}.json`);
    
    // Hash integrity
    const reportHash = crypto.createHash('sha256')
      .update(JSON.stringify(this.reportData))
      .digest('hex');
    
    this.reportData.integrity = {
      hash: reportHash,
      timestamp: new Date().toISOString(),
      readonly: true
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(this.reportData, null, 2));
    fs.chmodSync(reportFile, 0o444); // Read-only
    
    // Terminal özeti
    this.printSummary(reportFile);
    
    return this.reportData;
  }

  printSummary(reportFile) {
    console.log('\n🎯 UPGRADE PREVIEW SUMMARY');
    console.log('='.repeat(50));
    console.log(`📦 Package: ${this.reportData.upgrade.package}`);
    console.log(`📊 Current: ${this.reportData.upgrade.current_version}`);
    console.log(`🎯 Target: ${this.reportData.upgrade.target_version}`);
    console.log(`🔄 Type: ${this.reportData.upgrade.upgrade_type.toUpperCase()}`);
    
    console.log('\n📋 Preview Results:');
    console.log(`   Manifest: ${this.getStatusIcon(this.reportData.preview.manifest_check.status)}`);
    console.log(`   Build: ${this.getStatusIcon(this.reportData.preview.build_test.status)}`);
    console.log(`   Tests: ${this.getStatusIcon(this.reportData.preview.test_suite.status)}`);
    console.log(`   Alerts: ${this.getStatusIcon(this.reportData.preview.alert_validation.status)}`);
    
    console.log(`\n⚖️  Risk Level: ${this.reportData.risk_assessment.level.toUpperCase()}`);
    console.log(`💡 Recommendation: ${this.reportData.risk_assessment.recommendation}`);
    
    if (this.reportData.risk_assessment.factors.length > 0) {
      console.log('\n⚠️  Risk Factors:');
      this.reportData.risk_assessment.factors.forEach(factor => 
        console.log(`   • ${factor}`)
      );
    }
    
    console.log(`\n📁 Report saved: ${reportFile}`);
    console.log(`🔐 Report hash: ${this.reportData.integrity.hash.substring(0, 16)}...`);
  }

  getStatusIcon(status) {
    switch (status) {
      case 'passed': return '✅ PASSED';
      case 'failed': return '❌ FAILED';
      case 'warning': return '⚠️ WARNING';
      default: return '❓ UNKNOWN';
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node upgrade-preview.js <package-name> <target-version>');
    console.log('Example: node upgrade-preview.js next 14.3.0');
    console.log('Example: node upgrade-preview.js tailwindcss 4.0.0');
    process.exit(1);
  }
  
  const [packageName, targetVersion] = args;
  const reporter = new UpgradePreviewReporter(targetVersion, packageName);
  
  try {
    const result = reporter.generateReport();
    const exitCode = result.risk_assessment.level === 'high' ? 1 : 0;
    process.exit(exitCode);
  } catch (error) {
    console.error('🚨 Upgrade preview failed:', error.message);
    process.exit(1);
  }
}

module.exports = UpgradePreviewReporter;
