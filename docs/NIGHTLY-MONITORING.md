# 🌙 Nightly Monitoring System

Production-grade quality control and regression prevention system for ProCheff.

## 📋 Overview

The nightly monitoring system automatically generates comprehensive reports covering:
- **Build Status**: Route manifest, compilation success
- **Health Checks**: CSS imports, client/server separation, temporary flags
- **Route Analysis**: Conflict detection, structure validation
- **Trend Analysis**: Historical performance tracking

## 🚀 Quick Start

### Generate Report
```bash
npm run nightly          # Generate full nightly report
npm run nightly:today    # View today's report
npm run nightly:latest   # View latest report
npm run nightly:view     # View summary of all reports
```

### Setup Automated Scheduling
```bash
npm run nightly:setup    # Setup cron job (runs at 2 AM daily)
```

## 📊 Report Structure

### Status Levels
- 🟢 **HEALTHY**: All checks pass, no issues
- 🟡 **WARNING**: Minor issues, system functional
- 🔴 **CRITICAL**: Major failures, immediate attention required

### Monitored Metrics

#### Build Quality
- ✅ Compilation success
- ✅ Route manifest generation
- ✅ Bundle size tracking
- ✅ Error/warning detection

#### Route Health
- ✅ Root route conflicts (`/` uniqueness)
- ✅ Dashboard separation (`/dashboard` distinct)
- ✅ API route structure
- ✅ Static vs dynamic classification

#### Code Quality
- ✅ CSS import centralization (single entry point)
- ✅ Client/server component separation
- ✅ Temporary flag detection
- ✅ Import cycle prevention

#### Test Coverage
- ✅ Integration test status
- ✅ API endpoint validation
- ✅ Performance benchmarks

## 📁 Report Storage

Reports are stored in `/reports/` directory:
```
reports/
├── nightly-report-2025-10-18.json    # Daily report data
├── build-log-2025-10-18.txt          # Full build output
└── cron-2025-10-18.log               # Cron execution log
```

### Retention Policy
- **Reports**: 30 days
- **Build logs**: 30 days  
- **Cron logs**: 7 days

## 🚨 Alert System

### Automatic Alerts
The system detects and alerts on:

| Alert | Trigger | Impact |
|-------|---------|--------|
| `ROOT ROUTE CONFLICT` | Multiple `/` routes | Critical |
| `INTEGRATION TEST FAILURE` | Test failures | Critical |
| `BUILD FAILURE` | Compilation errors | Critical |
| `MULTIPLE CSS IMPORTS` | Scattered CSS | Warning |
| `TEMPORARY FLAGS PRESENT` | Config overrides | Warning |

### Custom Notifications
Extend the cron script to add email/Slack notifications:
```bash
# In nightly-cron.sh, uncomment:
echo "Alert: $message" | mail -s "ProCheff Alert" admin@example.com
```

## 📈 Trend Analysis

View historical trends:
```bash
npm run nightly:view     # Summary of last 10 reports
npm run nightly:history  # File listing
```

Example trend output:
```
Date       | Status | Build | Tests | Routes | Alerts
─────────────────────────────────────────────────────
2025-10-18 | 🟢     | ✅    | ✅    | ✅     | ✅ 0
2025-10-17 | 🟡     | ✅    | ✅    | ❌     | ⚠️ 1  
2025-10-16 | 🟢     | ✅    | ✅    | ✅     | ✅ 0

RECENT TRENDS (Last 7 days):
   Healthy: 6/7 (86%)
   Critical: 0/7 (0%)
```

## 🛠️ Configuration

### Scheduling
Default: Daily at 2:00 AM
```bash
# View current schedule
crontab -l

# Modify schedule
crontab -e
# Change: 0 2 * * * /path/to/nightly-cron.sh
```

### Thresholds
Modify alert thresholds in `scripts/nightly-report.js`:
```javascript
// Custom health check criteria
const ROUTE_LIMIT = 50;
const CSS_IMPORT_LIMIT = 1;
const BUILD_TIME_LIMIT = 300; // seconds
```

## 🔍 Troubleshooting

### Common Issues

**"No reports directory"**
```bash
mkdir -p reports
npm run nightly
```

**"Cron job not running"**
```bash
# Check cron service
sudo service cron status

# View cron logs
tail -f /var/log/syslog | grep CRON
```

**"Build failures in nightly"**
```bash
# Check build log
cat reports/build-log-$(date +%Y-%m-%d).txt

# Manual test
npm run build
```

### Debug Mode
```bash
# Run with verbose output
DEBUG=1 npm run nightly

# Skip certain checks
SKIP_TESTS=1 npm run nightly
```

## 📚 Integration

### CI/CD Pipeline
```yaml
# .github/workflows/nightly.yml
name: Nightly Quality Check
on:
  schedule:
    - cron: '0 2 * * *'
jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
      - name: Run Nightly Report
        run: npm run nightly
```

### Custom Metrics
Extend reporting with custom metrics:
```javascript
// In nightly-report.js
report.custom = {
  bundle_size: getBundleSize(),
  dependency_count: getDependencyCount(),
  security_score: getSecurityScore()
};
```

## 🎯 Success Criteria

System is considered **production-ready** when:
- ✅ 7+ consecutive healthy reports
- ✅ Zero critical alerts in 30 days
- ✅ Build success rate > 95%
- ✅ Route conflicts = 0
- ✅ CSS imports = 1 (centralized)
- ✅ Temporary flags = 0

---

**Last Updated**: 2025-10-18  
**Version**: 1.0.0  
**Maintainer**: ProCheff Development Team
