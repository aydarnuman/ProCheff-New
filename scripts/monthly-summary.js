#!/usr/bin/env node

/**
 * Monthly Summary Report Generator
 * 90 günlük arşiv analizi ve trend raporlaması
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPORT_DIR = path.join(__dirname, '../reports');
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

// Environment variable ile ay belirleyebiliriz, yoksa mevcut ay
const targetMonth = process.env.MONTH || currentDate.toISOString().slice(0, 7);
const monthDate = new Date(targetMonth + '-01');
const monthName = monthDate.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
const monthKey = targetMonth; // YYYY-MM format

console.log(`📊 Monthly Summary Generator - ${monthName}`);

// Ay sonu rapor dosyası
const MONTHLY_REPORT = path.join(REPORT_DIR, `monthly-summary-${monthKey}.json`);

// Hedef ayın tüm raporlarını topla
function collectMonthlyReports() {
  const reports = [];
  const files = fs.readdirSync(REPORT_DIR)
    .filter(file => file.startsWith('nightly-report-') && file.includes(monthKey))
    .sort();

  if (files.length === 0) {
    console.log('📭 No reports found for the target month');
    return reports;
  }

  console.log(`📁 Found ${files.length} reports for ${monthName}`);

  files.forEach(file => {
    try {
      const reportPath = path.join(REPORT_DIR, file);
      const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
      reports.push({
        date: report.date,
        status: report.status,
        build_success: report.build.success,
        test_passed: report.tests.integration.passed,
        test_failed: report.tests.integration.failed,
        route_conflicts: report.routes.root_conflict,
        health_css: report.health_checks.css_imports,
        health_flags: report.health_checks.temp_flags,
        alerts_count: report.alerts.length,
        route_count: report.routes.total_routes
      });
    } catch (error) {
      console.warn(`⚠️  Failed to parse ${file}: ${error.message}`);
    }
  });

  return reports;
}

// Trend analizi ve SLO hesaplama
function analyzeTrends(reports) {
  const totalDays = reports.length;
  const healthyDays = reports.filter(r => r.status === 'healthy').length;
  const warningDays = reports.filter(r => r.status === 'warning').length;
  const criticalDays = reports.filter(r => r.status === 'critical').length;
  
  const buildSuccessRate = (reports.filter(r => r.build_success).length / totalDays) * 100;
  const testSuccessRate = (reports.filter(r => r.test_failed === 0).length / totalDays) * 100;
  const routeStabilityRate = (reports.filter(r => !r.route_conflicts).length / totalDays) * 100;
  
  // SLO targets (Service Level Objectives)
  const SLO_TARGETS = {
    uptime: 99.5,           // 99.5% healthy status
    build_success: 95.0,    // 95% build success
    test_success: 90.0,     // 90% test success
    route_stability: 100.0  // 100% no route conflicts
  };
  
  const actualUptime = (healthyDays / totalDays) * 100;
  
  return {
    summary: {
      total_days: totalDays,
      healthy_days: healthyDays,
      warning_days: warningDays,
      critical_days: criticalDays,
      uptime_percentage: actualUptime
    },
    metrics: {
      build_success_rate: buildSuccessRate,
      test_success_rate: testSuccessRate,
      route_stability_rate: routeStabilityRate
    },
    slo_compliance: {
      uptime: {
        target: SLO_TARGETS.uptime,
        actual: actualUptime,
        compliant: actualUptime >= SLO_TARGETS.uptime
      },
      build_success: {
        target: SLO_TARGETS.build_success,
        actual: buildSuccessRate,
        compliant: buildSuccessRate >= SLO_TARGETS.build_success
      },
      test_success: {
        target: SLO_TARGETS.test_success,
        actual: testSuccessRate,
        compliant: testSuccessRate >= SLO_TARGETS.test_success
      },
      route_stability: {
        target: SLO_TARGETS.route_stability,
        actual: routeStabilityRate,
        compliant: routeStabilityRate >= SLO_TARGETS.route_stability
      }
    },
    alerts: {
      total_incidents: reports.reduce((sum, r) => sum + r.alerts_count, 0),
      critical_days: criticalDays,
      most_frequent_issues: analyzeMostFrequentIssues(reports)
    },
    error_budget: {
      uptime: calculateErrorBudget(SLO_TARGETS.uptime, actualUptime, totalDays),
      build_success: calculateErrorBudget(SLO_TARGETS.build_success, buildSuccessRate, totalDays),
      test_success: calculateErrorBudget(SLO_TARGETS.test_success, testSuccessRate, totalDays),
      route_stability: calculateErrorBudget(SLO_TARGETS.route_stability, routeStabilityRate, totalDays)
    },
    slo_heatmap: generateSLOHeatmap(reports, SLO_TARGETS),
    trend_analysis: generateTrendAnalysis(reports)
  };
}

// SLO Heatmap Generator - Haftalık bazda performans matrisi
function generateSLOHeatmap(reports, sloTargets) {
  const weeks = [];
  const reportsGrouped = groupReportsByWeek(reports);
  
  reportsGrouped.forEach((weekReports, weekIndex) => {
    const weekMetrics = calculateWeeklyMetrics(weekReports);
    const heatmapValues = {
      uptime: getHeatmapColor(weekMetrics.uptime, sloTargets.uptime),
      build_success: getHeatmapColor(weekMetrics.build_success, sloTargets.build_success),
      test_success: getHeatmapColor(weekMetrics.test_success, sloTargets.test_success),
      route_stability: getHeatmapColor(weekMetrics.route_stability, sloTargets.route_stability)
    };
    
    weeks.push({
      week: weekIndex + 1,
      start_date: weekReports[0].date,
      end_date: weekReports[weekReports.length - 1].date,
      metrics: weekMetrics,
      heatmap: heatmapValues,
      status: getWeeklyStatus(heatmapValues)
    });
  });
  
  return {
    weeks: weeks,
    legend: {
      green: 'Above SLO target',
      yellow: 'Near SLO target (90-100%)',
      red: 'Below SLO target'
    },
    matrix_summary: generateMatrixSummary(weeks)
  };
}

// Trend Analysis Generator
function generateTrendAnalysis(reports) {
  if (reports.length < 7) {
    return {
      summary: 'Insufficient data for trend analysis (minimum 7 days required)',
      trend: 'unknown',
      recommendation: 'Continue monitoring for meaningful trend data'
    };
  }
  
  const firstWeek = reports.slice(0, 7);
  const lastWeek = reports.slice(-7);
  
  const firstWeekMetrics = calculateWeeklyMetrics(firstWeek);
  const lastWeekMetrics = calculateWeeklyMetrics(lastWeek);
  
  const uptimeTrend = lastWeekMetrics.uptime - firstWeekMetrics.uptime;
  const buildTrend = lastWeekMetrics.build_success - firstWeekMetrics.build_success;
  const testTrend = lastWeekMetrics.test_success - firstWeekMetrics.test_success;
  
  const overallTrend = (uptimeTrend + buildTrend + testTrend) / 3;
  
  let trendDirection, trendSummary, recommendation;
  
  if (overallTrend > 5) {
    trendDirection = 'improving';
    trendSummary = 'System stability shows significant improvement across key metrics. Build success and uptime trends are positive.';
    recommendation = 'Continue current practices. Consider documenting successful strategies for knowledge retention.';
  } else if (overallTrend > 1) {
    trendDirection = 'stable_improving';
    trendSummary = 'System performance remains stable with slight improvement trend. No major issues detected.';
    recommendation = 'Maintain current monitoring levels. Focus on consistency in development practices.';
  } else if (overallTrend > -1) {
    trendDirection = 'stable';
    trendSummary = 'System performance is stable with minimal variation. Consistent delivery quality maintained.';
    recommendation = 'Current approach is effective. Regular reviews sufficient to maintain stability.';
  } else if (overallTrend > -5) {
    trendDirection = 'declining';
    trendSummary = 'Slight decline in system performance metrics. Early warning indicators suggest attention needed.';
    recommendation = 'Investigate recent changes. Review development practices and consider additional monitoring.';
  } else {
    trendDirection = 'degrading';
    trendSummary = 'Significant performance degradation detected. Multiple metrics showing downward trend.';
    recommendation = 'Immediate investigation required. Consider rollback of recent changes and intensive monitoring.';
  }
  
  return {
    trend_direction: trendDirection,
    summary: trendSummary,
    recommendation: recommendation,
    metrics_comparison: {
      uptime: { first_week: firstWeekMetrics.uptime, last_week: lastWeekMetrics.uptime, change: uptimeTrend },
      build_success: { first_week: firstWeekMetrics.build_success, last_week: lastWeekMetrics.build_success, change: buildTrend },
      test_success: { first_week: firstWeekMetrics.test_success, last_week: lastWeekMetrics.test_success, change: testTrend }
    },
    overall_change: overallTrend
  };
}

// Helper functions for SLO analysis
function calculateErrorBudget(target, actual, totalDays) {
  const allowedDowntime = ((100 - target) / 100) * totalDays;
  const actualDowntime = ((100 - actual) / 100) * totalDays;
  const remainingBudget = Math.max(0, allowedDowntime - actualDowntime);
  
  return {
    target_percentage: target,
    actual_percentage: actual,
    allowed_downtime_days: allowedDowntime,
    actual_downtime_days: actualDowntime,
    remaining_budget_days: remainingBudget,
    budget_consumed_percentage: ((actualDowntime / allowedDowntime) * 100)
  };
}

function groupReportsByWeek(reports) {
  const weeks = [];
  let currentWeek = [];
  
  reports.forEach((report, index) => {
    currentWeek.push(report);
    
    // Her 7 günde bir veya son rapor ise hafta olarak grupla
    if (currentWeek.length === 7 || index === reports.length - 1) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  });
  
  return weeks;
}

function calculateWeeklyMetrics(weekReports) {
  const totalDays = weekReports.length;
  const healthyDays = weekReports.filter(r => r.status === 'healthy').length;
  const buildSuccesses = weekReports.filter(r => r.build_success).length;
  const testSuccesses = weekReports.filter(r => r.test_failed === 0).length;
  const routeStable = weekReports.filter(r => !r.route_conflicts).length;
  
  return {
    uptime: (healthyDays / totalDays) * 100,
    build_success: (buildSuccesses / totalDays) * 100,
    test_success: (testSuccesses / totalDays) * 100,
    route_stability: (routeStable / totalDays) * 100
  };
}

function getHeatmapColor(actual, target) {
  const percentage = (actual / target) * 100;
  
  if (percentage >= 100) return 'green';
  if (percentage >= 90) return 'yellow';
  return 'red';
}

function getWeeklyStatus(heatmapValues) {
  const colors = Object.values(heatmapValues);
  const redCount = colors.filter(c => c === 'red').length;
  const yellowCount = colors.filter(c => c === 'yellow').length;
  
  if (redCount > 0) return 'critical';
  if (yellowCount > 1) return 'warning';
  return 'healthy';
}

function generateMatrixSummary(weeks) {
  const totalWeeks = weeks.length;
  const healthyWeeks = weeks.filter(w => w.status === 'healthy').length;
  const warningWeeks = weeks.filter(w => w.status === 'warning').length;
  const criticalWeeks = weeks.filter(w => w.status === 'critical').length;
  
  return {
    total_weeks: totalWeeks,
    healthy_weeks: healthyWeeks,
    warning_weeks: warningWeeks,
    critical_weeks: criticalWeeks,
    weekly_slo_compliance: ((healthyWeeks / totalWeeks) * 100).toFixed(1) + '%'
  };
}

function analyzeMostFrequentIssues(reports) {
  // Bu basit implementasyon - gerçek alert tiplerini parse etmek için genişletilebilir
  const issues = {};
  reports.forEach(report => {
    if (report.route_conflicts) issues['route_conflicts'] = (issues['route_conflicts'] || 0) + 1;
    if (report.health_css !== 'clean') issues['css_issues'] = (issues['css_issues'] || 0) + 1;
    if (report.health_flags !== 'clean') issues['temp_flags'] = (issues['temp_flags'] || 0) + 1;
    if (!report.build_success) issues['build_failures'] = (issues['build_failures'] || 0) + 1;
  });
  
  return Object.entries(issues)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([issue, count]) => ({ issue, count, percentage: (count / reports.length * 100).toFixed(1) }));
}

// Ana rapor üretimi
function generateMonthlySummary() {
  const reports = collectMonthlyReports();
  
  if (reports.length === 0) {
    console.log('📭 No reports found for the previous month');
    return;
  }
  
  const analysis = analyzeTrends(reports);
  
  const monthlySummary = {
    meta: {
      generated_at: new Date().toISOString(),
      month: monthName,
      month_key: monthKey,
      report_count: reports.length,
      period_start: reports[0]?.date,
      period_end: reports[reports.length - 1]?.date
    },
    environment: {
      node_env: process.env.NODE_ENV || 'development',
      production_grade: process.env.NODE_ENV === 'production'
    },
    ...analysis,
    raw_data: reports,
    integrity: {
      hash: generateDataHash(reports),
      timestamp: new Date().toISOString(),
      verified: true
    }
  };
  
  // Raporu kaydet
  fs.writeFileSync(MONTHLY_REPORT, JSON.stringify(monthlySummary, null, 2));
  
  // Dosyayı salt-okunur yap
  fs.chmodSync(MONTHLY_REPORT, 0o444);
  
  console.log(`✅ Monthly summary saved: ${MONTHLY_REPORT}`);
  console.log(`📊 Summary: ${reports.length} days, ${analysis.summary.uptime_percentage.toFixed(1)}% uptime`);
  
  // SLO uyumluluk raporu
  const sloViolations = Object.entries(analysis.slo_compliance)
    .filter(([, slo]) => !slo.compliant);
  
  if (sloViolations.length === 0) {
    console.log('🎯 SLO Compliance: ✅ ALL TARGETS MET');
  } else {
    console.log('🚨 SLO Violations:');
    sloViolations.forEach(([metric, slo]) => {
      console.log(`   ${metric}: ${slo.actual.toFixed(1)}% (target: ${slo.target}%)`);
    });
  }
  
  // SLO Heatmap Summary
  console.log('\n🔥 SLO Heatmap Matrix:');
  if (analysis.slo_heatmap && analysis.slo_heatmap.weeks) {
    analysis.slo_heatmap.weeks.forEach(week => {
      const statusIcon = week.status === 'healthy' ? '✅' : 
                        week.status === 'warning' ? '⚠️' : '🚨';
      console.log(`   Week ${week.week}: ${statusIcon} ${week.status.toUpperCase()}`);
    });
    console.log(`   📈 Weekly SLO Compliance: ${analysis.slo_heatmap.matrix_summary.weekly_slo_compliance}`);
  }
  
  // Trend Analysis Summary
  console.log('\n📈 Trend Analysis:');
  if (analysis.trend_analysis && analysis.trend_analysis.trend_direction) {
    const trendIcon = analysis.trend_analysis.trend_direction === 'improving' ? '📈' :
                     analysis.trend_analysis.trend_direction === 'declining' ? '📉' : '📊';
    console.log(`   ${trendIcon} Direction: ${analysis.trend_analysis.trend_direction.toUpperCase()}`);
    console.log(`   💡 Summary: ${analysis.trend_analysis.summary}`);
  } else {
    console.log('   📊 Direction: INSUFFICIENT DATA');
    console.log('   💡 Summary: More data needed for trend analysis');
  }
  
  return monthlySummary;
}

function generateDataHash(data) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(data))
    .digest('hex');
}

// Script çalıştırması
try {
  generateMonthlySummary();
  process.exit(0);
} catch (error) {
  console.error('❌ Monthly summary generation failed:', error.message);
  process.exit(1);
}
