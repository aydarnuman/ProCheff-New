#!/usr/bin/env node

/**
 * Nightly Report Viewer
 * Raporları görüntüler ve analiz eder
 */

const fs = require('fs');
const path = require('path');

const REPORT_DIR = path.join(__dirname, '../reports');

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getStatusIcon(status) {
  switch (status) {
    case 'healthy': return '🟢';
    case 'warning': return '🟡';
    case 'critical': return '🔴';
    default: return '⚪';
  }
}

function showReport(reportFile) {
  try {
    const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
    
    console.log(`\n${getStatusIcon(report.status)} REPORT: ${report.date}`);
    console.log('─'.repeat(50));
    console.log(`📅 Generated: ${formatDate(report.timestamp)}`);
    console.log(`🎯 Status: ${report.status.toUpperCase()}`);
    
    // Build info
    console.log(`\n🔨 BUILD:`);
    console.log(`   Success: ${report.build.success ? '✅' : '❌'}`);
    console.log(`   Routes: ${report.build.routes.length}`);
    if (report.build.errors.length > 0) {
      console.log(`   Errors: ${report.build.errors.length}`);
    }
    
    // Tests info
    console.log(`\n🧪 TESTS:`);
    console.log(`   Passed: ${report.tests.integration.passed}`);
    console.log(`   Failed: ${report.tests.integration.failed}`);
    
    // Routes info
    console.log(`\n🛣️  ROUTES:`);
    console.log(`   Total: ${report.routes.total_routes}`);
    console.log(`   Root conflict: ${report.routes.root_conflict ? '❌ YES' : '✅ NO'}`);
    console.log(`   Dashboard separate: ${report.routes.dashboard_separate ? '✅ YES' : '❌ NO'}`);
    
    // Health checks
    console.log(`\n🏥 HEALTH:`);
    console.log(`   CSS imports: ${report.health_checks.css_imports === 'clean' ? '✅' : '⚠️'} ${report.health_checks.css_imports}`);
    console.log(`   Temp flags: ${report.health_checks.temp_flags === 'clean' ? '✅' : '⚠️'} ${report.health_checks.temp_flags}`);
    console.log(`   Client/Server: ${report.health_checks.client_server_separation === 'separated' ? '✅' : '⚠️'} ${report.health_checks.client_server_separation}`);
    
    // Alerts
    if (report.alerts.length > 0) {
      console.log(`\n🚨 ALERTS:`);
      report.alerts.forEach(alert => console.log(`   ${alert}`));
    }
    
    return report;
    
  } catch (error) {
    console.error(`❌ Error reading report: ${error.message}`);
    return null;
  }
}

function showSummary() {
  if (!fs.existsSync(REPORT_DIR)) {
    console.log('📁 No reports directory found. Run `npm run nightly` first.');
    return;
  }
  
  const reportFiles = fs.readdirSync(REPORT_DIR)
    .filter(file => file.startsWith('nightly-report-') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (reportFiles.length === 0) {
    console.log('📁 No nightly reports found. Run `npm run nightly` first.');
    return;
  }
  
  console.log('📊 NIGHTLY REPORTS SUMMARY');
  console.log('='.repeat(70));
  
  const reports = reportFiles.slice(0, 10).map(file => {
    const report = JSON.parse(fs.readFileSync(path.join(REPORT_DIR, file), 'utf8'));
    return {
      date: report.date,
      status: report.status,
      build: report.build.success,
      tests: report.tests.integration.failed === 0,
      routes: !report.routes.root_conflict,
      alerts: report.alerts.length
    };
  });
  
  // Header
  console.log('Date       | Status | Build | Tests | Routes | Alerts');
  console.log('─'.repeat(70));
  
  // Data rows
  reports.forEach(report => {
    const date = report.date;
    const status = getStatusIcon(report.status);
    const build = report.build ? '✅' : '❌';
    const tests = report.tests ? '✅' : '❌';
    const routes = report.routes ? '✅' : '❌';
    const alerts = report.alerts > 0 ? `⚠️ ${report.alerts}` : '✅ 0';
    
    console.log(`${date} | ${status}     | ${build}    | ${tests}    | ${routes}     | ${alerts}`);
  });
  
  // Recent trends
  const recentReports = reports.slice(0, 7);
  const healthyCount = recentReports.filter(r => r.status === 'healthy').length;
  const criticalCount = recentReports.filter(r => r.status === 'critical').length;
  
  console.log('\n📈 RECENT TRENDS (Last 7 days):');
  console.log(`   Healthy: ${healthyCount}/7 (${Math.round(healthyCount/7*100)}%)`);
  console.log(`   Critical: ${criticalCount}/7 (${Math.round(criticalCount/7*100)}%)`);
  
  if (criticalCount > 0) {
    console.log('\n🚨 CRITICAL ISSUES DETECTED IN RECENT REPORTS!');
  }
}

// CLI interface
const args = process.argv.slice(2);

if (args.length === 0) {
  showSummary();
} else if (args[0] === 'latest') {
  const reportFiles = fs.readdirSync(REPORT_DIR)
    .filter(file => file.startsWith('nightly-report-') && file.endsWith('.json'))
    .sort()
    .reverse();
  
  if (reportFiles.length > 0) {
    showReport(path.join(REPORT_DIR, reportFiles[0]));
  } else {
    console.log('📁 No reports found.');
  }
} else if (args[0] === 'today') {
  const today = new Date().toISOString().split('T')[0];
  const todayReport = path.join(REPORT_DIR, `nightly-report-${today}.json`);
  
  if (fs.existsSync(todayReport)) {
    showReport(todayReport);
  } else {
    console.log(`📁 No report found for today (${today}). Run \`npm run nightly\`.`);
  }
} else {
  // Specific date
  const reportFile = path.join(REPORT_DIR, `nightly-report-${args[0]}.json`);
  
  if (fs.existsSync(reportFile)) {
    showReport(reportFile);
  } else {
    console.log(`📁 No report found for ${args[0]}.`);
  }
}
