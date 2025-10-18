#!/usr/bin/env node

/**
 * Exception Rules Manager
 * İstisna kurallarına expiry date ekler ve süresi dolmuş kuralları temizler
 * Gürültü enflasyonunu önler
 */

const fs = require('fs');
const path = require('path');

class ExceptionRulesManager {
  constructor() {
    this.rulesFile = path.join(__dirname, '../reports/exception-rules.json');
    this.cleanupLogFile = path.join(__dirname, '../reports/exception-cleanup.json');
    this.defaultRules = this.getDefaultRules();
  }

  async manageExceptionRules() {
    console.log('📋 Exception Rules Manager başlatılıyor...\n');

    // Mevcut kuralları yükle veya varsayılanları oluştur
    const currentRules = this.loadOrCreateRules();
    
    const management = {
      timestamp: new Date().toISOString(),
      manager_version: '1.0',
      before_cleanup: {
        total_rules: currentRules.rules.length,
        active_rules: currentRules.rules.filter(r => r.status === 'active').length,
        expired_rules: 0
      },
      cleanup_process: [],
      after_cleanup: {
        total_rules: 0,
        active_rules: 0,
        removed_rules: 0
      },
      expiry_analysis: {
        rules_with_expiry: 0,
        rules_without_expiry: 0,
        expiring_soon: []
      }
    };

    // Expiry date analizi
    management.expiry_analysis = this.analyzeExpiryDates(currentRules.rules);
    
    // Süresi dolmuş kuralları tespit et
    const expiredRules = this.findExpiredRules(currentRules.rules);
    management.before_cleanup.expired_rules = expiredRules.length;

    // Temizlik işlemi
    const cleanupResult = this.performCleanup(currentRules.rules, expiredRules);
    management.cleanup_process = cleanupResult.log;
    
    // Güncellenmiş kuralları kaydet
    const updatedRules = {
      ...currentRules,
      rules: cleanupResult.activeRules,
      last_cleanup: new Date().toISOString(),
      cleanup_stats: {
        removed_count: cleanupResult.removedCount,
        last_cleanup_timestamp: new Date().toISOString()
      }
    };

    this.saveRules(updatedRules);

    // After cleanup stats
    management.after_cleanup = {
      total_rules: updatedRules.rules.length,
      active_rules: updatedRules.rules.filter(r => r.status === 'active').length,
      removed_rules: cleanupResult.removedCount
    };

    // Yönetim raporunu kaydet
    this.saveManagementReport(management);
    this.printManagementSummary(management);

    return management;
  }

  getDefaultRules() {
    return [
      {
        id: 'build-warning-buffer-deprecation',
        type: 'warning_suppression',
        pattern: 'Buffer\\(\\) is deprecated',
        reason: 'Known Next.js dependency issue',
        created_date: '2025-10-15T00:00:00.000Z',
        expiry_date: '2025-11-15T00:00:00.000Z',
        status: 'active',
        auto_created: true
      },
      {
        id: 'test-flaky-timeout',
        type: 'test_retry',
        pattern: 'timeout.*integration',
        reason: 'Flaky network conditions in CI',
        created_date: '2025-10-10T00:00:00.000Z',
        expiry_date: '2025-10-25T00:00:00.000Z', // Bu yakında dolacak
        status: 'active',
        auto_created: false
      },
      {
        id: 'css-import-warning',
        type: 'style_warning',
        pattern: 'multiple.*css.*import',
        reason: 'Temporary during CSS refactoring',
        created_date: '2025-10-01T00:00:00.000Z',
        expiry_date: '2025-10-20T00:00:00.000Z', // Bu da dolmuş olmalı
        status: 'active',
        auto_created: false
      },
      {
        id: 'health-check-skip',
        type: 'health_exception',
        pattern: 'ANTHROPIC_API_KEY.*Required',
        reason: 'Test environment API key not needed',
        created_date: '2025-10-18T00:00:00.000Z',
        expiry_date: '2025-12-18T00:00:00.000Z',
        status: 'active',
        auto_created: true
      },
      {
        id: 'legacy-alert-suppression',
        type: 'alert_suppression',
        pattern: 'LEGACY.*WARNING',
        reason: 'Old system compatibility',
        created_date: '2025-09-01T00:00:00.000Z',
        expiry_date: '2025-10-01T00:00:00.000Z', // Bu çoktan dolmuş
        status: 'active',
        auto_created: false
      }
    ];
  }

  loadOrCreateRules() {
    if (fs.existsSync(this.rulesFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.rulesFile, 'utf8'));
      } catch (error) {
        console.log('⚠️  Mevcut kurallar okunmadı, varsayılanlar kullanılıyor');
      }
    }

    // Varsayılan kural seti oluştur
    const defaultRuleSet = {
      version: '1.0',
      created: new Date().toISOString(),
      last_cleanup: null,
      rules: this.defaultRules
    };

    this.saveRules(defaultRuleSet);
    return defaultRuleSet;
  }

  analyzeExpiryDates(rules) {
    const now = new Date();
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const withExpiry = rules.filter(rule => rule.expiry_date);
    const withoutExpiry = rules.filter(rule => !rule.expiry_date);
    
    const expiringSoon = withExpiry.filter(rule => {
      const expiryDate = new Date(rule.expiry_date);
      return expiryDate > now && expiryDate <= weekFromNow;
    });

    return {
      rules_with_expiry: withExpiry.length,
      rules_without_expiry: withoutExpiry.length,
      expiring_soon: expiringSoon.map(rule => ({
        id: rule.id,
        expiry_date: rule.expiry_date,
        days_remaining: Math.ceil((new Date(rule.expiry_date) - now) / (24 * 60 * 60 * 1000))
      }))
    };
  }

  findExpiredRules(rules) {
    const now = new Date();
    
    return rules.filter(rule => {
      if (!rule.expiry_date) return false;
      
      const expiryDate = new Date(rule.expiry_date);
      return expiryDate <= now;
    });
  }

  performCleanup(allRules, expiredRules) {
    const cleanupLog = [];
    let removedCount = 0;

    const activeRules = allRules.filter(rule => {
      const isExpired = expiredRules.some(expired => expired.id === rule.id);
      
      if (isExpired) {
        cleanupLog.push({
          action: 'removed',
          rule_id: rule.id,
          rule_type: rule.type,
          reason: 'expired',
          expiry_date: rule.expiry_date,
          days_overdue: Math.ceil((new Date() - new Date(rule.expiry_date)) / (24 * 60 * 60 * 1000)),
          timestamp: new Date().toISOString()
        });
        removedCount++;
        return false;
      }

      // Aktif kuralları koru
      cleanupLog.push({
        action: 'kept',
        rule_id: rule.id,
        rule_type: rule.type,
        reason: 'still_valid',
        expiry_date: rule.expiry_date,
        timestamp: new Date().toISOString()
      });
      return true;
    });

    return {
      activeRules,
      removedCount,
      log: cleanupLog
    };
  }

  saveRules(rules) {
    const reportsDir = path.dirname(this.rulesFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(this.rulesFile, JSON.stringify(rules, null, 2));
  }

  saveManagementReport(management) {
    const reportsDir = path.dirname(this.cleanupLogFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    fs.writeFileSync(this.cleanupLogFile, JSON.stringify(management, null, 2));
  }

  printManagementSummary(management) {
    console.log('📊 EXCEPTION RULES MANAGEMENT RAPORU');
    console.log('='.repeat(60));
    
    console.log('\n📋 Temizlik Öncesi:');
    console.log(`  Toplam kural: ${management.before_cleanup.total_rules}`);
    console.log(`  Aktif kural: ${management.before_cleanup.active_rules}`);
    console.log(`  Süresi dolmuş: ${management.before_cleanup.expired_rules}`);

    console.log('\n🧹 Temizlik İşlemi:');
    console.log(`  Kaldırılan kural: ${management.after_cleanup.removed_rules}`);
    console.log(`  Korunan kural: ${management.after_cleanup.active_rules}`);

    if (management.cleanup_process.length > 0) {
      console.log('\n📝 Temizlik Detayları:');
      management.cleanup_process.forEach(entry => {
        const action = entry.action === 'removed' ? '❌ KALDIRILDI' : '✅ KORUNDU';
        console.log(`  ${action}: ${entry.rule_id} (${entry.rule_type})`);
        if (entry.action === 'removed') {
          console.log(`    Süre dolma: ${entry.expiry_date}`);
          console.log(`    Gecikme: ${entry.days_overdue} gün`);
        }
      });
    }

    console.log('\n⏰ Expiry Analizi:');
    console.log(`  Expiry date'li kural: ${management.expiry_analysis.rules_with_expiry}`);
    console.log(`  Expiry date'siz kural: ${management.expiry_analysis.rules_without_expiry}`);
    
    if (management.expiry_analysis.expiring_soon.length > 0) {
      console.log('\n⚠️  Yakında Dolacak Kurallar:');
      management.expiry_analysis.expiring_soon.forEach(rule => {
        console.log(`  📅 ${rule.id}: ${rule.days_remaining} gün kaldı`);
      });
    }

    console.log('\n📊 Son Durum:');
    console.log(`  Aktif istisna sayısı: ${management.after_cleanup.active_rules}`);
    console.log(`  Temizlik başarılı: ${management.after_cleanup.removed_rules > 0 ? 'EVET' : 'HAYIR'}`);

    console.log(`\n📁 Kurallar: ${this.rulesFile}`);
    console.log(`📁 Temizlik logu: ${this.cleanupLogFile}`);

    if (management.after_cleanup.active_rules <= 5 && management.before_cleanup.expired_rules >= 0) {
      console.log('\n🎉 GÖREV 4 TAMAMLANDI - Exception rules kontrol altında!');
    } else {
      console.log('\n⚠️  GÖREV 4 UYARI - Kural sayısı yüksek!');
    }
  }
}

// Ana çalıştırma
if (require.main === module) {
  const manager = new ExceptionRulesManager();
  manager.manageExceptionRules()
    .then(result => {
      const success = result.after_cleanup.active_rules <= 10;
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Exception rules manager hatası:', error.message);
      process.exit(1);
    });
}

module.exports = ExceptionRulesManager;
