#!/usr/bin/env node

/**
 * Privacy Scanner
 * Sır bilgisi, anahtar ve hassas veri sızıntı taraması
 */

const fs = require('fs');
const path = require('path');

class PrivacyScanner {
  constructor() {
    this.sensitivePatterns = {
      // API Keys ve Secrets
      api_keys: [
        /(?:api[_-]?key|apikey)[\s=:"']*([a-z0-9_-]{16,})/gi,
        /(?:secret[_-]?key|secretkey)[\s=:"']*([a-z0-9_-]{16,})/gi,
        /(?:access[_-]?token|accesstoken)[\s=:"']*([a-z0-9_-]{16,})/gi
      ],
      
      // Database credentials
      database: [
        /(?:password|pwd)[\s=:"']*([^"\s'{}\[\]]+)/gi,
        /(?:username|user)[\s=:"']*([^"\s'{}\[\]]+)/gi,
        /(?:host|hostname)[\s=:"']*([^"\s'{}\[\]]+)/gi,
        /mongodb:\/\/[^"\s]+/gi,
        /postgres:\/\/[^"\s]+/gi
      ],
      
      // Email ve personal data
      emails: [
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      ],
      
      // Cloud provider keys
      aws: [
        /AKIA[0-9A-Z]{16}/g,
        /aws_access_key_id[\s=:"']*([A-Z0-9]{20})/gi,
        /aws_secret_access_key[\s=:"']*([A-Za-z0-9/+=]{40})/gi
      ],
      
      // JWT tokens
      jwt: [
        /eyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g
      ],
      
      // Private keys
      private_keys: [
        /-----BEGIN [A-Z ]+PRIVATE KEY-----/g,
        /-----BEGIN RSA PRIVATE KEY-----/g,
        /-----BEGIN EC PRIVATE KEY-----/g
      ],
      
      // Credit card patterns (PCI compliance)
      credit_cards: [
        /\b4[0-9]{12}(?:[0-9]{3})?\b/g,        // Visa
        /\b5[1-5][0-9]{14}\b/g,                // MasterCard
        /\b3[47][0-9]{13}\b/g                  // American Express
      ]
    };
    
    this.whitelistPatterns = [
      // Örnek/demo veriler
      /example\.com/gi,
      /test\.com/gi,
      /localhost/gi,
      /127\.0\.0\.1/gi,
      /demo@/gi,
      /test@/gi,
      
      // Placeholder değerler
      /your[_-]?api[_-]?key/gi,
      /your[_-]?secret/gi,
      /placeholder/gi,
      /xxx+/gi,
      /\*+/gi
    ];
    
    this.excludePatterns = [
      // Node modules ve build artifacts
      /node_modules/,
      /\.next/,
      /dist/,
      /build/,
      /coverage/,
      
      // Binary files
      /\.(jpg|jpeg|png|gif|pdf|zip|tar|gz)$/i,
      
      // Package locks
      /package-lock\.json$/,
      /yarn\.lock$/,
      
      // Git
      /\.git/
    ];
  }

  scanProject(projectPath) {
    const results = {
      scan_timestamp: new Date().toISOString(),
      scan_status: 'clean',
      privacy_summary: {
        total_files_scanned: 0,
        sensitive_files_found: 0,
        total_violations: 0,
        risk_level: 'low'
      },
      violations: [],
      excluded_files: []
    };

    try {
      this.scanDirectory(projectPath, results);
      this.analyzeSeverity(results);
      
      if (results.violations.length > 0) {
        results.scan_status = 'warning';
      }
      
    } catch (error) {
      results.scan_status = 'error';
      results.error_message = error.message;
    }

    return results;
  }

  scanDirectory(dirPath, results, basePath = '') {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const relativePath = path.join(basePath, item);
      
      // Hariç tutulan dosya/dizinleri atla
      if (this.shouldExclude(relativePath)) {
        results.excluded_files.push(relativePath);
        return;
      }
      
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, results, relativePath);
      } else if (stat.isFile()) {
        this.scanFile(fullPath, relativePath, results);
      }
    });
  }

  shouldExclude(filePath) {
    return this.excludePatterns.some(pattern => pattern.test(filePath));
  }

  scanFile(filePath, relativePath, results) {
    results.privacy_summary.total_files_scanned++;
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const fileViolations = this.scanContent(content, relativePath);
      
      if (fileViolations.length > 0) {
        results.privacy_summary.sensitive_files_found++;
        results.violations.push(...fileViolations);
      }
      
    } catch (error) {
      // Binary file veya okuma hatası - sessizce geç
      if (!error.message.includes('EISDIR')) {
        results.excluded_files.push(`${relativePath} (read error)`);
      }
    }
  }

  scanContent(content, filePath) {
    const violations = [];
    
    Object.entries(this.sensitivePatterns).forEach(([category, patterns]) => {
      patterns.forEach(pattern => {
        let match;
        const regex = new RegExp(pattern.source, pattern.flags);
        
        while ((match = regex.exec(content)) !== null) {
          const matchText = match[0];
          
          // Whitelist kontrolü
          if (this.isWhitelisted(matchText)) {
            continue;
          }
          
          const lineNumber = this.getLineNumber(content, match.index);
          const contextLine = this.getContextLine(content, match.index);
          
          violations.push({
            file: filePath,
            line: lineNumber,
            category: category,
            pattern_type: this.getPatternDescription(category),
            matched_text: this.maskSensitiveData(matchText),
            context: contextLine.replace(matchText, '[REDACTED]'),
            severity: this.getSeverity(category),
            recommendation: this.getRecommendation(category)
          });
        }
      });
    });
    
    return violations;
  }

  isWhitelisted(text) {
    return this.whitelistPatterns.some(pattern => pattern.test(text));
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  getContextLine(content, index) {
    const lines = content.split('\n');
    const lineNumber = this.getLineNumber(content, index) - 1;
    return lines[lineNumber] || '';
  }

  maskSensitiveData(text) {
    if (text.length <= 8) {
      return '*'.repeat(text.length);
    }
    
    const start = text.substring(0, 3);
    const end = text.substring(text.length - 3);
    const middle = '*'.repeat(text.length - 6);
    
    return start + middle + end;
  }

  getPatternDescription(category) {
    const descriptions = {
      api_keys: 'API Keys / Secrets',
      database: 'Database Credentials',
      emails: 'Email Addresses',
      aws: 'AWS Credentials',
      jwt: 'JWT Tokens',
      private_keys: 'Private Keys',
      credit_cards: 'Credit Card Numbers'
    };
    
    return descriptions[category] || category;
  }

  getSeverity(category) {
    const severityMap = {
      private_keys: 'high',
      aws: 'high',
      api_keys: 'high',
      database: 'high',
      jwt: 'medium',
      credit_cards: 'high',
      emails: 'low'
    };
    
    return severityMap[category] || 'medium';
  }

  getRecommendation(category) {
    const recommendations = {
      api_keys: 'Store in environment variables or secure key vault',
      database: 'Use environment variables for database credentials',
      emails: 'Replace with example emails in documentation',
      aws: 'Use IAM roles or environment variables',
      jwt: 'Never commit JWT tokens, use short-lived tokens',
      private_keys: 'Store private keys securely, never in code',
      credit_cards: 'Use test card numbers for development'
    };
    
    return recommendations[category] || 'Review and secure sensitive data';
  }

  analyzeSeverity(results) {
    const highSeverityCount = results.violations.filter(v => v.severity === 'high').length;
    const mediumSeverityCount = results.violations.filter(v => v.severity === 'medium').length;
    
    results.privacy_summary.total_violations = results.violations.length;
    
    if (highSeverityCount > 0) {
      results.privacy_summary.risk_level = 'high';
    } else if (mediumSeverityCount > 0) {
      results.privacy_summary.risk_level = 'medium';
    } else if (results.violations.length > 0) {
      results.privacy_summary.risk_level = 'low';
    }
  }

  generateReport(scanResults) {
    const report = {
      privacy_check: scanResults.scan_status,
      risk_assessment: scanResults.privacy_summary.risk_level,
      files_scanned: scanResults.privacy_summary.total_files_scanned,
      violations_found: scanResults.privacy_summary.total_violations,
      sensitive_files: scanResults.privacy_summary.sensitive_files_found
    };

    if (scanResults.violations.length > 0) {
      report.violation_details = scanResults.violations.map(v => ({
        file: v.file,
        line: v.line,
        type: v.pattern_type,
        severity: v.severity,
        recommendation: v.recommendation
      }));
    }

    return report;
  }
}

// Script execution
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const scanner = new PrivacyScanner();
  
  console.log('🔒 Privacy Scanner Starting...');
  console.log(`📂 Scanning: ${projectPath}`);
  console.log('='.repeat(50));
  
  const scanResults = scanner.scanProject(projectPath);
  const report = scanner.generateReport(scanResults);
  
  console.log(`🔍 Files Scanned: ${report.files_scanned}`);
  console.log(`🚨 Violations: ${report.violations_found}`);
  console.log(`⚠️  Risk Level: ${report.risk_assessment.toUpperCase()}`);
  console.log(`📊 Status: ${report.privacy_check.toUpperCase()}`);
  
  if (scanResults.violations.length > 0) {
    console.log('\n🚨 PRIVACY VIOLATIONS FOUND:');
    scanResults.violations.forEach((violation, index) => {
      console.log(`\n${index + 1}. ${violation.file}:${violation.line}`);
      console.log(`   Type: ${violation.pattern_type}`);
      console.log(`   Severity: ${violation.severity.toUpperCase()}`);
      console.log(`   Context: ${violation.context}`);
      console.log(`   Fix: ${violation.recommendation}`);
    });
  }
  
  // JSON report
  const reportPath = path.join(projectPath, 'reports', `privacy-scan-${new Date().toISOString().split('T')[0]}.json`);
  if (fs.existsSync(path.dirname(reportPath))) {
    fs.writeFileSync(reportPath, JSON.stringify(scanResults, null, 2));
    console.log(`\n📁 Report saved: ${reportPath}`);
  }
}

module.exports = PrivacyScanner;
