#!/usr/bin/env node

/**
 * SLO/SLA Compliance Checker
 * Service Level Objectives monitoring ve ihlal uyarı sistemi
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '../reports');
const SLO_REPORT_FILE = path.join(REPORT_DIR, 'slo-compliance.json');

// SLO/SLA Tanımları (Production-grade targets)
const SLO_TARGETS = {
  // Availability SLOs
  uptime: {
    target: 99.5,           // 99.5% uptime (3.6 hours downtime/month)
    description: 'System availability',
    measurement: 'percentage',
    period: '30 days'
  },
  
  // Performance SLOs  
  build_success: {
    target: 95.0,           // 95% build success rate
    description: 'Build reliability',
    measurement: 'percentage',
    period: '14 days'
  },
  
  test_success: {
    target: 90.0,           // 90% test success rate
    description: 'Test suite reliability', 
    measurement: 'percentage',
    period: '14 days'
  },
  
  // Stability SLOs
  route_stability: {
    target: 100.0,          // 100% route stability (no conflicts)
    description: 'Route configuration stability',
    measurement: 'percentage',
    period: '30 days'
  },
  
  config_hygiene: {
    target: 100.0,          // 100% clean config (no temp flags)
    description: 'Configuration hygiene',
    measurement: 'percentage', 
    period: '14 days'
  },
  
  // Response Time SLOs (future implementation)
  incident_response: {
    target: 24,             // 24 hours max resolution time
    description: 'Critical incident response time',
    measurement: 'hours',
    period: '30 days'
  }
};

// SLA Error Budgets (maximum allowed violations)
const ERROR_BUDGETS = {
  uptime: 0.5,              // 0.5% error budget (3.6h/month)
  build_success: 5.0,       // 5% error budget  
  test_success: 10.0,       // 10% error budget
  route_stability: 0.0,     // 0% error budget (zero tolerance)
  config_hygiene: 0.0       // 0% error budget (zero tolerance)
};

class SLOMonitor {
  constructor() {
    this.currentDate = new Date();
    this.reports14Days = this.loadReports(14);
    this.reports30Days = this.loadReports(30);
  }

  loadReports(days) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const reports = [];
    const files = fs.readdirSync(REPORT_DIR)
      .filter(file => file.startsWith('nightly-report-') && file.endsWith('.json'))
      .sort();

    files.forEach(file => {
      try {
        const reportPath = path.join(REPORT_DIR, file);
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        const reportDate = new Date(report.date);
        
        if (reportDate >= cutoffDate) {
          reports.push(report);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to parse ${file}`);
      }
    });

    return reports.sort((a, b) => new Date(a.date) - new Date(b.date));
  }

  calculateSLOCompliance() {
    const compliance = {};
    
    // Uptime SLO (30 days)
    compliance.uptime = this.calculateUptimeSLO(this.reports30Days);
    
    // Build Success SLO (14 days)
    compliance.build_success = this.calculateBuildSuccessSLO(this.reports14Days);
    
    // Test Success SLO (14 days)
    compliance.test_success = this.calculateTestSuccessSLO(this.reports14Days);
    
    // Route Stability SLO (30 days)
    compliance.route_stability = this.calculateRouteStabilitySLO(this.reports30Days);
    
    // Config Hygiene SLO (14 days)
    compliance.config_hygiene = this.calculateConfigHygieneSLO(this.reports14Days);
    
    return compliance;
  }

  calculateUptimeSLO(reports) {
    if (reports.length === 0) return this.createSLOResult('uptime', 0, 0, 'insufficient_data');
    
    const healthyReports = reports.filter(r => r.status === 'healthy').length;
    const actualUptime = (healthyReports / reports.length) * 100;
    const target = SLO_TARGETS.uptime.target;
    
    return this.createSLOResult('uptime', actualUptime, target, 
      actualUptime >= target ? 'compliant' : 'violation');
  }

  calculateBuildSuccessSLO(reports) {
    if (reports.length === 0) return this.createSLOResult('build_success', 0, 0, 'insufficient_data');
    
    const successfulBuilds = reports.filter(r => r.build && r.build.success).length;
    const actualSuccess = (successfulBuilds / reports.length) * 100;
    const target = SLO_TARGETS.build_success.target;
    
    return this.createSLOResult('build_success', actualSuccess, target,
      actualSuccess >= target ? 'compliant' : 'violation');
  }

  calculateTestSuccessSLO(reports) {
    if (reports.length === 0) return this.createSLOResult('test_success', 0, 0, 'insufficient_data');
    
    const successfulTests = reports.filter(r => 
      r.tests && r.tests.integration && r.tests.integration.failed === 0).length;
    const actualSuccess = (successfulTests / reports.length) * 100;
    const target = SLO_TARGETS.test_success.target;
    
    return this.createSLOResult('test_success', actualSuccess, target,
      actualSuccess >= target ? 'compliant' : 'violation');
  }

  calculateRouteStabilitySLO(reports) {
    if (reports.length === 0) return this.createSLOResult('route_stability', 0, 0, 'insufficient_data');
    
    const stableRoutes = reports.filter(r => 
      r.routes && !r.routes.root_conflict).length;
    const actualStability = (stableRoutes / reports.length) * 100;
    const target = SLO_TARGETS.route_stability.target;
    
    return this.createSLOResult('route_stability', actualStability, target,
      actualStability >= target ? 'compliant' : 'violation');
  }

  calculateConfigHygieneSLO(reports) {
    if (reports.length === 0) return this.createSLOResult('config_hygiene', 0, 0, 'insufficient_data');
    
    const cleanConfigs = reports.filter(r => 
      r.health_checks && r.health_checks.temp_flags === 'clean').length;
    const actualHygiene = (cleanConfigs / reports.length) * 100;
    const target = SLO_TARGETS.config_hygiene.target;
    
    return this.createSLOResult('config_hygiene', actualHygiene, target,
      actualHygiene >= target ? 'compliant' : 'violation');
  }

  createSLOResult(metric, actual, target, status) {
    const errorBudget = ERROR_BUDGETS[metric] || 0;
    const errorBudgetUsed = Math.max(0, target - actual);
    const errorBudgetRemaining = Math.max(0, errorBudget - errorBudgetUsed);
    
    return {
      metric,
      target,
      actual: parseFloat(actual.toFixed(2)),
      status,
      error_budget: errorBudget,
      error_budget_used: parseFloat(errorBudgetUsed.toFixed(2)),
      error_budget_remaining: parseFloat(errorBudgetRemaining.toFixed(2)),
      violation: status === 'violation',
      description: SLO_TARGETS[metric]?.description || metric,
      measurement_period: SLO_TARGETS[metric]?.period || 'unknown'
    };
  }

  analyzeViolations(compliance) {
    const violations = Object.values(compliance).filter(slo => slo.violation);
    const warnings = Object.values(compliance).filter(slo => 
      !slo.violation && slo.error_budget_remaining < slo.error_budget * 0.2); // 20% threshold
    
    return {
      total_violations: violations.length,
      total_warnings: warnings.length,
      violations: violations.map(v => ({
        metric: v.metric,
        description: v.description,
        actual: v.actual,
        target: v.target,
        deficit: (v.target - v.actual).toFixed(2)
      })),
      warnings: warnings.map(w => ({
        metric: w.metric,
        description: w.description,
        error_budget_remaining: w.error_budget_remaining
      })),
      overall_compliance: violations.length === 0
    };
  }

  generateIncidentReport(violations) {
    if (violations.total_violations === 0) return null;
    
    return {
      incident_id: `SLO-${new Date().toISOString().slice(0, 10)}-${Date.now()}`,
      created_at: new Date().toISOString(),
      severity: violations.total_violations > 2 ? 'critical' : 'major',
      title: `SLO Violation: ${violations.total_violations} metric(s) below target`,
      description: `Automated SLO monitoring detected ${violations.total_violations} service level violations`,
      affected_slos: violations.violations,
      requires_response: true,
      response_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h
      status: 'open'
    };
  }

  generateReport() {
    console.log('🎯 SLO/SLA Compliance Monitor');
    console.log('='.repeat(60));
    
    const compliance = this.calculateSLOCompliance();
    const violations = this.analyzeViolations(compliance);
    const incident = this.generateIncidentReport(violations);
    
    const sloReport = {
      generated_at: new Date().toISOString(),
      measurement_periods: {
        short_term: '14 days',
        long_term: '30 days'
      },
      data_coverage: {
        reports_14_days: this.reports14Days.length,
        reports_30_days: this.reports30Days.length
      },
      compliance,
      violations,
      incident,
      overall_status: violations.overall_compliance ? 'compliant' : 'violation',
      next_review: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Raporu kaydet
    fs.writeFileSync(SLO_REPORT_FILE, JSON.stringify(sloReport, null, 2));
    fs.chmodSync(SLO_REPORT_FILE, 0o444);
    
    // Console output
    console.log(`📊 Measurement Period: Last 14-30 days`);
    console.log(`📈 Data Coverage: ${this.reports14Days.length}/14 short-term, ${this.reports30Days.length}/30 long-term`);
    
    console.log('\n🎯 SLO Compliance Status:');
    Object.entries(compliance).forEach(([metric, slo]) => {
      const icon = slo.violation ? '❌' : '✅';
      const status = slo.violation ? 'VIOLATION' : 'COMPLIANT';
      console.log(`   ${icon} ${slo.description}: ${slo.actual}% (target: ${slo.target}%) - ${status}`);
      
      if (slo.violation) {
        console.log(`      Error Budget Used: ${slo.error_budget_used}% of ${slo.error_budget}%`);
      }
    });
    
    if (violations.total_violations === 0) {
      console.log('\n🎉 OVERALL STATUS: ✅ ALL SLOs COMPLIANT');
    } else {
      console.log(`\n🚨 OVERALL STATUS: ❌ ${violations.total_violations} SLO VIOLATION(S)`);
      
      if (incident) {
        console.log(`\n📋 Incident Created: ${incident.incident_id}`);
        console.log(`   Severity: ${incident.severity.toUpperCase()}`);
        console.log(`   Response Required By: ${new Date(incident.response_deadline).toLocaleString()}`);
      }
    }
    
    if (violations.total_warnings > 0) {
      console.log(`\n⚠️  ${violations.total_warnings} Warning(s): Error budget running low`);
    }
    
    console.log(`\n📁 SLO Report: ${SLO_REPORT_FILE}`);
    
    return sloReport;
  }
}

// Script execution
if (require.main === module) {
  const monitor = new SLOMonitor();
  const result = monitor.generateReport();
  
  process.exit(result.overall_status === 'compliant' ? 0 : 1);
}

module.exports = SLOMonitor;
