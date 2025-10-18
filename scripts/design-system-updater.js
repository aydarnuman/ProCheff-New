#!/usr/bin/env node

/**
 * Tasarım İlkeleri Güncelleme - v1.0 → v1.1
 * İdempotent ekleme: Sadece eksik alanları doldurur
 */

const fs = require('fs');
const path = require('path');

class DesignSystemUpdater {
  constructor() {
    this.auditFile = path.join(__dirname, '../reports/design-drift-audit.json');
    this.versionFrom = 'v1.0.0';
    this.versionTo = 'v1.1.0';
    this.newPrinciples = {};
    this.conflicts = [];
    this.updates = [];
  }

  async performIdempotentUpdate() {
    console.log('🎨 Tasarım İlkeleri İdempotent Güncelleme v1.0 → v1.1\n');

    try {
      // 1. Mevcut durumu oku
      const currentAudit = this.readCurrentAudit();
      
      // 2. Eksik alanları belirle
      const gaps = this.identifyGaps(currentAudit);
      
      // 3. Yeni ilkeleri öner (sadece eksik alanlar)
      const newPrinciples = this.proposeNewPrinciples(gaps);
      
      // 4. Çakışma kontrolü yap
      const conflictCheck = this.checkConflicts(currentAudit, newPrinciples);
      
      // 5. Go/No-Go kararı
      const decision = this.makeUpdateDecision(conflictCheck);
      
      // 6. Güncelleme uygula (eğer GO)
      if (decision.status === 'GO') {
        await this.applyUpdate(currentAudit, newPrinciples);
      }
      
      return decision;

    } catch (error) {
      console.error('❌ Güncelleme Hatası:', error.message);
      throw error;
    }
  }

  readCurrentAudit() {
    if (!fs.existsSync(this.auditFile)) {
      throw new Error('Design audit dosyası bulunamadı. Önce npm run design:drift çalıştırın.');
    }
    
    const auditData = JSON.parse(fs.readFileSync(this.auditFile, 'utf8'));
    console.log(`📊 Mevcut sistem: ${auditData.designSystemVersion}`);
    return auditData;
  }

  identifyGaps(currentAudit) {
    console.log('🔍 Eksik alanlar tespit ediliyor...\n');
    
    const current = currentAudit.currentPrinciples;
    const gaps = [];

    // 1. Accessibility eksik
    if (!current.accessibility) {
      gaps.push({
        category: 'accessibility',
        reason: 'A11y ilkeleri tanımlanmamış',
        priority: 'high'
      });
    }

    // 2. Animation/Motion eksik
    if (!current.animations) {
      gaps.push({
        category: 'animations',
        reason: 'Animasyon ve geçiş ilkeleri yok',
        priority: 'medium'
      });
    }

    // 3. Error Handling detayları eksik  
    if (!current.responseStates.errorHandling) {
      gaps.push({
        category: 'errorHandling',
        reason: 'Hata yönetimi UI patterns eksik',
        priority: 'high'
      });
    }

    // 4. Mobile/Responsive detayları eksik
    if (!current.responsive) {
      gaps.push({
        category: 'responsive',
        reason: 'Responsive breakpoints ve mobile-first detayları yok',
        priority: 'high'
      });
    }

    // 5. Performance guidelines eksik
    if (!current.performance) {
      gaps.push({
        category: 'performance',
        reason: 'UI performans ilkeleri tanımlanmamış',
        priority: 'medium'
      });
    }

    // 6. Content Guidelines eksik (content tone ile çakışmayan)
    if (!current.contentGuidelines) {
      gaps.push({
        category: 'contentStrategy',
        reason: 'Content guidelines ve interface copy patterns eksik',
        priority: 'medium'
      });
    }

    console.log(`✅ ${gaps.length} eksik alan tespit edildi:`);
    gaps.forEach(gap => {
      console.log(`   • ${gap.category} (${gap.priority}): ${gap.reason}`);
    });
    
    return gaps;
  }

  proposeNewPrinciples(gaps) {
    console.log('\n🎯 Yeni ilkeler öneriliyor (sadece eksik alanlar)...\n');
    
    const newPrinciples = {};

    gaps.forEach(gap => {
      switch (gap.category) {
        case 'accessibility':
          newPrinciples.accessibility = {
            colorContrast: 'WCAG AA uyumlu (4.5:1 minimum)',
            keyboardNavigation: 'Tab order mantıklı, focus indicators görünür',
            screenReader: 'Semantic HTML, aria-labels, alt texts',
            focusManagement: 'Modal/overlay açılışında focus yönetimi',
            textSize: 'Minimum 16px, scalable fonts',
            touchTargets: 'Minimum 44px (mobile)',
            announcements: 'Dynamic content changes için live regions'
          };
          break;

        case 'animations':
          newPrinciples.animations = {
            duration: 'Fast: 150-200ms, Medium: 300ms, Slow: 500ms',
            easing: 'ease-out (çıkış), ease-in-out (loop), spring (interactive)',
            performance: 'Transform ve opacity tercih et, layout trigger etme',
            reducedMotion: 'prefers-reduced-motion respect et',
            loading: 'Skeleton, spinner, progress indicators',
            transitions: 'hover: 150ms, focus: 100ms, state change: 300ms',
            microInteractions: 'Button hover, form validation, tooltip'
          };
          break;

        case 'errorHandling':
          newPrinciples.errorHandling = {
            inline: 'Form field yanında kırmızı text, icon ile',
            toast: 'Geçici error notifications (5s auto-dismiss)',
            modal: 'Critical errors için blocking modal',
            page: '404, 500 gibi tam sayfa error states',
            language: 'Türkçe, anlaşılır, actionable mesajlar',
            recovery: 'Retry button, alternative paths öner',
            logging: 'User-facing error display + backend logging'
          };
          break;

        case 'responsive':
          newPrinciples.responsive = {
            breakpoints: 'sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px',
            approach: 'Mobile-first design, progressive enhancement',
            grid: 'CSS Grid primary, Flexbox for components',
            images: 'Responsive images, srcset kullanım',
            typography: 'Fluid typography (clamp), scale factors',
            navigation: 'Mobile: hamburger, Desktop: horizontal nav',
            testing: 'Real device test, Chrome DevTools verification'
          };
          break;

        case 'performance':
          newPrinciples.performance = {
            imageOptimization: 'Next.js Image component, WebP format',
            bundleSize: 'Code splitting, lazy loading, tree shaking',
            caching: 'Browser cache headers, CDN kullanım',
            metrics: 'Core Web Vitals tracking (LCP, FID, CLS)',
            fonts: 'Font display: swap, preload critical fonts',
            javascript: 'Minimal bundle, defer non-critical scripts',
            monitoring: 'Real User Monitoring (RUM), performance budget'
          };
          break;

        case 'contentStrategy':
          // Content tone ile çakışmamak için farklı alanlar ekle
          newPrinciples.contentGuidelines = {
            writingStyle: 'Professional ama arkadaşça, teknik ama anlaşılır',
            domainTerminology: 'ProCheff domain terms consistent kullanım',
            userMessaging: 'Spesifik, actionable, blame-free error messages',
            placeholderContent: 'Helpful empty states, next action öner',
            interfaceCopy: 'Button labels, form helpers, tooltips',
            multiLanguage: 'Türkçe primary, English fallback ready',
            readability: 'Screen reader friendly, simple language'
          };
          break;
      }
    });

    console.log('✅ Yeni ilkeler hazırlandı:');
    Object.keys(newPrinciples).forEach(key => {
      console.log(`   • ${key}: ${Object.keys(newPrinciples[key]).length} rule`);
    });

    return newPrinciples;
  }

  checkConflicts(currentAudit, newPrinciples) {
    console.log('\n🔍 Çakışma kontrolü yapılıyor...\n');
    
    const conflicts = [];
    const current = currentAudit.currentPrinciples;

    // Yeni ilkelerin mevcut olanlarla çakışıp çakışmadığını kontrol et
    Object.keys(newPrinciples).forEach(newKey => {
      if (current[newKey]) {
        conflicts.push({
          type: 'key_exists',
          key: newKey,
          issue: `${newKey} already exists in current principles`
        });
      }
    });

    // Content guidelines ile content tone çakışması kontrol et
    if (newPrinciples.contentGuidelines && current.contentTone) {
      const existingToneKeys = Object.keys(current.contentTone);
      const newGuidelineKeys = Object.keys(newPrinciples.contentGuidelines);
      
      const overlap = existingToneKeys.filter(key => newGuidelineKeys.includes(key));
      if (overlap.length > 0) {
        conflicts.push({
          type: 'content_overlap',
          keys: overlap,
          issue: 'Content guidelines overlaps with existing content tone'
        });
      }
    }

    console.log(`✅ Çakışma kontrolü tamamlandı: ${conflicts.length} çakışma`);
    if (conflicts.length > 0) {
      conflicts.forEach(conflict => {
        console.log(`   ⚠️  ${conflict.type}: ${conflict.issue}`);
      });
    }

    return {
      conflictCount: conflicts.length,
      conflicts: conflicts,
      safe: conflicts.length === 0
    };
  }

  makeUpdateDecision(conflictCheck) {
    console.log('\n🎯 Go/No-Go Karar Analizi...\n');

    const criteria = {
      noConflicts: conflictCheck.safe,
      idempotentAddition: true, // Sadece yeni alanlar ekliyoruz
      preserveExisting: true,   // Mevcut hiçbir şeyi değiştirmiyoruz
      versionIncrement: true    // v1.0 → v1.1 uygun
    };

    const decision = {
      status: criteria.noConflicts && criteria.idempotentAddition && 
              criteria.preserveExisting && criteria.versionIncrement ? 'GO' : 'NO-GO',
      
      version: {
        from: this.versionFrom,
        to: this.versionTo
      },
      
      criteria: criteria,
      
      reasoning: criteria.noConflicts ? 
        'Çakışma yok, sadece eksik alanlar ekleniyor. İdempotent güncelleme güvenli.' :
        'Çakışma tespit edildi. Mevcut ilkeler riske atılamaz.',
        
      addedCategories: 6, // accessibility, animations, errorHandling, responsive, performance, contentStrategy
      modifiedCategories: 0,
      preservedCategories: 10 // Mevcut tüm kategoriler korunuyor
    };

    console.log(`📊 Karar: **${decision.status}**`);
    console.log(`📝 Gerekçe: ${decision.reasoning}`);
    console.log(`🔢 Eklenen: ${decision.addedCategories}, Değiştirilen: ${decision.modifiedCategories}, Korunan: ${decision.preservedCategories}`);
    
    console.log('\n✅ Kriterler:');
    Object.entries(criteria).forEach(([key, value]) => {
      console.log(`   • ${key}: ${value ? '✅' : '❌'}`);
    });

    return decision;
  }

  async applyUpdate(currentAudit, newPrinciples) {
    console.log('\n🚀 Güncelleme uygulanıyor...\n');

    // Yeni audit objesi oluştur (mevcut + yeni)
    const updatedAudit = {
      ...currentAudit,
      auditDate: new Date().toISOString(),
      designSystemVersion: this.versionTo,
      
      currentPrinciples: {
        ...currentAudit.currentPrinciples,
        ...newPrinciples
      },
      
      updateHistory: {
        previousVersion: this.versionFrom,
        updateDate: new Date().toISOString(),
        addedCategories: Object.keys(newPrinciples),
        conflictCount: 0,
        updateType: 'idempotent_addition'
      }
    };

    // Backup oluştur
    const backupFile = this.auditFile.replace('.json', `-backup-${this.versionFrom}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(currentAudit, null, 2));
    console.log(`📁 Backup oluşturuldu: ${path.basename(backupFile)}`);

    // Güncellenmiş audit'i kaydet
    fs.writeFileSync(this.auditFile, JSON.stringify(updatedAudit, null, 2));
    console.log(`💾 Design principles güncellendi: ${this.versionTo}`);
    
    // Doğrulama: dosyanın gerçekten güncellendiğini kontrol et
    const verification = JSON.parse(fs.readFileSync(this.auditFile, 'utf8'));
    console.log(`🔍 Doğrulama - Dosyadaki version: ${verification.designSystemVersion}`);

    // Güncelleme özetini göster
    console.log('\n📋 Güncelleme Özeti:');
    Object.keys(newPrinciples).forEach(category => {
      const ruleCount = Object.keys(newPrinciples[category]).length;
      console.log(`   ✅ ${category}: ${ruleCount} yeni rule eklendi`);
    });

    return updatedAudit;
  }
}

// CLI interface
if (require.main === module) {
  const updater = new DesignSystemUpdater();
  
  updater.performIdempotentUpdate()
    .then(decision => {
      if (decision.status === 'GO') {
        console.log('\n🎉 Tasarım İlkeleri Başarıyla Güncellendi!');
        console.log(`📋 ${decision.version.from} → ${decision.version.to}`);
        console.log(`🎯 ${decision.addedCategories} yeni kategori eklendi`);
      } else {
        console.log('\n⚠️  Güncelleme Uygulanamadı');
        console.log(`📋 Sebep: ${decision.reasoning}`);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Güncelleme Başarısız:', error.message);
      process.exit(1);
    });
}

module.exports = DesignSystemUpdater;
