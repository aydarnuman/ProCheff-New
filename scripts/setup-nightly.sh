#!/bin/bash

# Nightly Report Cron Job Setup Script
# Her gece 02:00'da çalışacak şekilde yapılandırır

echo "🌙 Setting up nightly report cron job..."

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CRON_SCRIPT="$PROJECT_DIR/scripts/nightly-cron.sh"

# Cron script oluştur
cat > "$CRON_SCRIPT" << EOF
#!/bin/bash

# Nightly Report Cron Runner
# Generated on $(date)

export PATH="/usr/local/bin:/usr/bin:/bin:\$PATH"
export NODE_ENV=production

cd "$PROJECT_DIR"

# Log file
LOG_FILE="$PROJECT_DIR/reports/cron-\$(date +%Y-%m-%d).log"

echo "\$(date): Starting nightly report..." >> "\$LOG_FILE"

# Run nightly report
npm run nightly >> "\$LOG_FILE" 2>&1

EXIT_CODE=\$?

if [ \$EXIT_CODE -eq 0 ]; then
    echo "\$(date): Nightly report completed successfully" >> "\$LOG_FILE"
else
    echo "\$(date): Nightly report failed with exit code \$EXIT_CODE" >> "\$LOG_FILE"
    
    # Optional: Send alert (uncomment to enable)
    # echo "Nightly report failed on \$(hostname) at \$(date)" | mail -s "ProCheff Nightly Report Failed" admin@example.com
fi

# Cleanup old reports (keep last 90 days for audit trail)
find "$PROJECT_DIR/reports" -name "nightly-report-*.json" -mtime +90 -delete
find "$PROJECT_DIR/reports" -name "build-log-*.txt" -mtime +90 -delete
find "$PROJECT_DIR/reports" -name "monthly-summary-*.json" -mtime +365 -delete
find "$PROJECT_DIR/reports" -name "cron-*.log" -mtime +7 -delete

# Generate monthly summary on last day of month
if [ "\$(date +%d)" = "\$(date -d 'next month' +%d)" ]; then
    echo "\$(date): Generating monthly summary..." >> "\$LOG_FILE"
    node "$PROJECT_DIR/scripts/monthly-summary.js" >> "\$LOG_FILE" 2>&1
fi

echo "\$(date): Cleanup completed" >> "\$LOG_FILE"
EOF

# Script'i çalıştırılabilir yap
chmod +x "$CRON_SCRIPT"

# Mevcut crontab'ı backup al
crontab -l > "$PROJECT_DIR/reports/crontab-backup-$(date +%Y%m%d).txt" 2>/dev/null || true

# Cron job ekle (her gece 02:00)
CRON_ENTRY="0 2 * * * $CRON_SCRIPT"

# Mevcut crontab'ı al ve yeni entry'yi ekle
(crontab -l 2>/dev/null | grep -v "$PROJECT_DIR/scripts/nightly-cron.sh"; echo "$CRON_ENTRY") | crontab -

echo "✅ Cron job added successfully!"
echo "📅 Schedule: Every night at 02:00"
echo "📁 Reports location: $PROJECT_DIR/reports/"
echo "📝 Cron script: $CRON_SCRIPT"
echo ""
echo "To view current crontab:"
echo "  crontab -l"
echo ""
echo "To remove the cron job:"
echo "  crontab -l | grep -v '$PROJECT_DIR' | crontab -"
echo ""
echo "To run manually:"
echo "  npm run nightly"
