#!/usr/bin/env node

/**
 * Exception Rules Manager
 * Yanlış pozitif uyarıları filtreler ve gerçek hataları öne çıkarır
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '../reports');
const EXCEPTIONS_FILE = path.join(REPORT_DIR, 'exception-rules.json');

// Varsayılan istisna kuralları
const DEFAULT_EXCEPTION_RULES = {
  last_updated: new Date().toISOString(),
  rules: {
    // Buffer deprecation warnings - Node.js versiyonu ile ilgili, kritik değil
    buffer_deprecation: {
      pattern: /Buffer\(\) is deprecated/,
      severity_override: 'warning',
      reason: 'Known Node.js deprecation, not blocking',
      expiry: null
    },
    
    // Vite CJS deprecation - tool warning, uygulama etkisi yok
    vite_cjs_warning: {
      pattern: /The CJS build of Vite's Node API is deprecated/,
      severity_override: 'info',
      reason: 'Vite tooling warning, no application impact',
      expiry: '2025-12-31'
    },
    
    // Next.js config değişiklik uyarıları - development işlemi
    nextjs_config_restart: {
      pattern: /Found a change in next\.config\.js.*Restarting/,
      severity_override: 'info',
      reason: 'Normal development workflow',
      expiry: null
    },
    
    // Production environment olmayan durumlarda - CI/CD sürecinde normal
    non_production_env: {
      pattern: /NON-PRODUCTION ENVIRONMENT DETECTED/,
      severity_override: 'warning',
      ignore_conditions: ['NODE_ENV=development', 'CI=true'],
      reason: 'Expected in development/CI environments',
      expiry: null
    }
  },
  escalation_thresholds: {
    single_occurrence: 'warning',      // Tek seferlik: warning
    consecutive_days: 2,               // 2 gece üst üste: critical  
    weekly_threshold: 5                // Hafta içinde 5 kez: critical
  },
  alert_history: {
    // Son 30 günlük alert geçmişi tutulur
    retention_days: 30
  }
};

class ExceptionRulesManager {
  constructor() {
    this.rules = this.loadRules();
    this.alertHistory = this.loadAlertHistory();
  }

  loadRules() {
    if (fs.existsSync(EXCEPTIONS_FILE)) {
      try {
        return JSON.parse(fs.readFileSync(EXCEPTIONS_FILE, 'utf8'));
      } catch (error) {
        console.warn('⚠️  Failed to load exception rules, using defaults');
        return DEFAULT_EXCEPTION_RULES;
      }
    }
    return DEFAULT_EXCEPTION_RULES;
  }

  loadAlertHistory() {
    const historyFiles = fs.readdirSync(REPORT_DIR)
      .filter(file => file.startsWith('nightly-report-') && file.endsWith('.json'))
      .sort()
      .reverse()
      .slice(0, 30); // Son 30 gün

    const history = [];
    historyFiles.forEach(file => {
      try {
        const reportPath = path.join(REPORT_DIR, file);
        const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
        
        if (report.alerts && report.alerts.length > 0) {
          history.push({
            date: report.date,
            alerts: report.alerts,
            status: report.status
          });
        }
      } catch (error) {
        // Sessizce geç
      }
    });

    return history;
  }

  // Nightly report için basit wrapper metodu
  filterAlerts(alerts, context = {}) {
    const result = this.applyExceptionRules(alerts, context.timestamp || new Date().toISOString());
    return result.processed_alerts;
  }

  getActiveRules() {
    return Object.keys(this.rules.rules);
  }

  applyExceptionRules(alerts, currentDate) {
    const processedAlerts = [];
    const suppressedAlerts = [];
    const escalatedAlerts = [];

    alerts.forEach(alert => {
      const ruleMatch = this.findMatchingRule(alert);
      
      if (ruleMatch) {
        const escalationLevel = this.checkEscalation(alert, currentDate);
        
        if (escalationLevel === 'suppress') {
          suppressedAlerts.push({
            original: alert,
            rule: ruleMatch.name,
            reason: ruleMatch.rule.reason
          });
        } else if (escalationLevel === 'escalate') {
          escalatedAlerts.push({
            original: alert,
            new_severity: 'critical',
            reason: 'Repeated occurrence exceeds threshold'
          });
          processedAlerts.push(`🚨 ESCALATED: ${alert}`);
        } else {
          // Severity override uygula
          const newSeverity = ruleMatch.rule.severity_override || 'warning';
          const processedAlert = this.applyOverride(alert, newSeverity, ruleMatch);
          processedAlerts.push(processedAlert);
        }
      } else {
        // Kural bulunamadı, orijinal alert'i koru
        processedAlerts.push(alert);
      }
    });

    return {
      processed_alerts: processedAlerts,
      suppressed_alerts: suppressedAlerts,
      escalated_alerts: escalatedAlerts,
      exception_summary: {
        total_original: alerts.length,
        total_processed: processedAlerts.length,
        total_suppressed: suppressedAlerts.length,
        total_escalated: escalatedAlerts.length,
        noise_reduction: suppressedAlerts.length > 0 ? 
          ((suppressedAlerts.length / alerts.length) * 100).toFixed(1) + '%' : '0%'
      }
    };
  }

  findMatchingRule(alert) {
    const rules = this.rules.rules;
    
    for (const [ruleName, rule] of Object.entries(rules)) {
      if (rule.pattern && alert.match && alert.match(rule.pattern)) {
        return { name: ruleName, rule };
      }
      
      // String matching için basit kontrol
      if (typeof rule.pattern === 'string' && alert.includes(rule.pattern)) {
        return { name: ruleName, rule };
      }
    }
    
    return null;
  }

  checkEscalation(alert, currentDate) {
    const recentOccurrences = this.countRecentOccurrences(alert);
    const consecutiveDays = this.countConsecutiveDays(alert, currentDate);
    
    // Konsekütif gün kontrolü
    if (consecutiveDays >= this.rules.escalation_thresholds.consecutive_days) {
      return 'escalate';
    }
    
    // Haftalık eşik kontrolü
    if (recentOccurrences >= this.rules.escalation_thresholds.weekly_threshold) {
      return 'escalate';
    }
    
    return 'apply_rule';
  }

  countRecentOccurrences(alert) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Son 7 gün
    
    return this.alertHistory.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= cutoffDate && 
             day.alerts.some(dayAlert => this.alertsMatch(alert, dayAlert));
    }).length;
  }

  countConsecutiveDays(alert, currentDate) {
    let consecutiveDays = 0;
    const sortedHistory = this.alertHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    for (const day of sortedHistory) {
      if (day.alerts.some(dayAlert => this.alertsMatch(alert, dayAlert))) {
        consecutiveDays++;
      } else {
        break; // Zincirleme kırıldı
      }
    }
    
    return consecutiveDays;
  }

  alertsMatch(alert1, alert2) {
    // Basit string matching - geliştirilmiş pattern matching eklenebilir
    const normalize = (str) => str.replace(/[0-9]+/g, 'N').toLowerCase();
    return normalize(alert1) === normalize(alert2);
  }

  applyOverride(alert, newSeverity, ruleMatch) {
    const severityIcons = {
      'info': 'ℹ️',
      'warning': '⚠️',
      'critical': '🚨'
    };
    
    const icon = severityIcons[newSeverity] || '⚠️';
    return `${icon} ${newSeverity.toUpperCase()}: ${alert} [Rule: ${ruleMatch.name}]`;
  }

  updateRules(newRules) {
    this.rules = {
      ...this.rules,
      ...newRules,
      last_updated: new Date().toISOString()
    };
    
    fs.writeFileSync(EXCEPTIONS_FILE, JSON.stringify(this.rules, null, 2));
    fs.chmodSync(EXCEPTIONS_FILE, 0o644); // Düzenlenebilir
  }

  generateRulesReport() {
    const activeRules = Object.keys(this.rules.rules).length;
    const expiredRules = Object.values(this.rules.rules)
      .filter(rule => rule.expiry && new Date(rule.expiry) < new Date()).length;
    
    return {
      active_rules: activeRules,
      expired_rules: expiredRules,
      escalation_config: this.rules.escalation_thresholds,
      last_updated: this.rules.last_updated,
      rules_file: EXCEPTIONS_FILE
    };
  }
}

// Script execution
if (require.main === module) {
  const manager = new ExceptionRulesManager();
  
  // Test alerts
  const testAlerts = [
    '⚠️ Buffer() is deprecated due to security issues',
    '⚠️ NON-PRODUCTION ENVIRONMENT DETECTED',
    '🚨 BUILD FAILURE DETECTED'
  ];
  
  console.log('🔧 Exception Rules Manager');
  console.log('='.repeat(50));
  
  const result = manager.applyExceptionRules(testAlerts, new Date().toISOString().split('T')[0]);
  const rulesReport = manager.generateRulesReport();
  
  console.log(`📋 Active Rules: ${rulesReport.active_rules}`);
  console.log(`📊 Noise Reduction: ${result.exception_summary.noise_reduction}`);
  console.log(`🔇 Suppressed: ${result.exception_summary.total_suppressed}`);
  console.log(`🚨 Escalated: ${result.exception_summary.total_escalated}`);
  
  if (result.suppressed_alerts.length > 0) {
    console.log('\n🔇 Suppressed Alerts:');
    result.suppressed_alerts.forEach(item => {
      console.log(`   ${item.original} [${item.reason}]`);
    });
  }
  
  console.log(`\n📁 Rules file: ${EXCEPTIONS_FILE}`);
}

module.exports = ExceptionRulesManager;
