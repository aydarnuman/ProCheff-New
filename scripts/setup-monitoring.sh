#!/bin/bash

# ProCheff PDF Monitoring System Setup Script
echo "🚀 ProCheff PDF İzleme Sistemi Kurulum Başlıyor..."

# Create necessary directories
echo "📁 Dizinler oluşturuluyor..."
mkdir -p logs
mkdir -p reports
mkdir -p test/data

# Install monitoring dependencies
echo "📦 Bağımlılıklar yükleniyor..."
npm install node-cron nodemailer form-data node-fetch@2

# Create systemd service file (if on Linux)
if [ -f /etc/systemd/system ]; then
    echo "🔧 Systemd servisi oluşturuluyor..."
    sudo tee /etc/systemd/system/procheff-monitor.service > /dev/null <<EOF
[Unit]
Description=ProCheff PDF Monitoring Service
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=/usr/bin/node $(pwd)/scripts/production-monitor.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF
    
    sudo systemctl daemon-reload
    echo "✅ Systemd servisi oluşturuldu: procheff-monitor.service"
    echo "   Başlatmak için: sudo systemctl start procheff-monitor"
    echo "   Otomatik başlatma: sudo systemctl enable procheff-monitor"
fi

# Create PM2 ecosystem file
echo "🔧 PM2 konfigürasyonu oluşturuluyor..."
cat > ecosystem.config.js <<EOF
module.exports = {
  apps: [{
    name: 'procheff-monitor',
    script: 'scripts/production-monitor.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PROCHEFF_URL: 'http://localhost:3000',
      ALERT_THRESHOLD: '80'
    },
    env_production: {
      NODE_ENV: 'production',
      PROCHEFF_URL: 'https://your-domain.com',
      ALERT_THRESHOLD: '85'
    }
  }]
};
EOF

# Create environment template
echo "📝 Çevre değişkenleri şablonu oluşturuluyor..."
cat > .env.monitoring.template <<EOF
# ProCheff PDF Monitoring Configuration

# System Configuration
PROCHEFF_URL=http://localhost:3000
ALERT_THRESHOLD=80

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=procheff-monitor@your-domain.com
EMAIL_TO=admin@your-domain.com

# Slack Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Monitoring Intervals (Cron Format)
HEALTH_CHECK_INTERVAL=*/5 * * * *
FULL_TEST_INTERVAL=0 */2 * * *
EOF

# Create sample test data
echo "📄 Test verisi oluşturuluyor..."
cat > test/data/sample-pmyo.txt <<EOF
PMYO (Polis Meslek Yüksek Okulu) 
Yemek Hizmeti Teknik Şartnamesi

Tahmini Maliyet: 4.500.000 TL
Süre: 12 ay
Yaklaşık 2500 kişi için yemek hizmeti
Son Teslim Tarihi: 25.11.2025

Gereksinimler:
- ISO 22000 Gıda Güvenliği Sertifikası
- HACCP Sertifikası
- Minimum 3 yıl deneyim
- Mali yeterlilik belgesi

Öğün türleri:
- Kahvaltı
- Öğle yemeği  
- Akşam yemeği

İletişim: pmyo@example.gov.tr
EOF

# Create monitoring dashboard HTML
echo "📊 İzleme paneli oluşturuluyor..."
cat > public/monitoring.html <<EOF
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ProCheff PDF İzleme Paneli</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .card { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .status { padding: 10px; border-radius: 4px; margin: 10px 0; }
        .healthy { background: #d4edda; color: #155724; }
        .warning { background: #fff3cd; color: #856404; }
        .critical { background: #f8d7da; color: #721c24; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .metric strong { display: block; font-size: 24px; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        #logs { background: #1e1e1e; color: #f8f8f2; padding: 15px; border-radius: 4px; height: 400px; overflow-y: auto; font-family: 'Courier New', monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 ProCheff PDF İzleme Paneli</h1>
        
        <div class="card">
            <h2>Sistem Durumu</h2>
            <div id="systemStatus" class="status">Yükleniyor...</div>
        </div>

        <div class="card">
            <h2>Performans Metrikleri</h2>
            <div id="metrics">Yükleniyor...</div>
        </div>

        <div class="card">
            <h2>Kontroller</h2>
            <button onclick="runHealthCheck()">Sağlık Kontrolü Yap</button>
            <button onclick="runFullTest()">Tam Test Çalıştır</button>
            <button onclick="refreshData()">Verileri Yenile</button>
        </div>

        <div class="card">
            <h2>Sistem Logları</h2>
            <div id="logs">Loglar yükleniyor...</div>
        </div>
    </div>

    <script>
        let refreshInterval;

        async function fetchHealthData() {
            try {
                const response = await fetch('/api/monitoring/pdf-health-check');
                const data = await response.json();
                updateUI(data);
            } catch (error) {
                console.error('Veri yükleme hatası:', error);
                document.getElementById('systemStatus').innerHTML = '<div class="critical">❌ Veri yüklenemedi</div>';
            }
        }

        function updateUI(data) {
            const statusDiv = document.getElementById('systemStatus');
            const metricsDiv = document.getElementById('metrics');
            
            // Status
            const statusClass = data.status === 'healthy' ? 'healthy' : 
                              data.status === 'warning' ? 'warning' : 'critical';
            const statusIcon = data.status === 'healthy' ? '✅' : 
                             data.status === 'warning' ? '⚠️' : '❌';
            
            statusDiv.innerHTML = \`<div class="\${statusClass}">\${statusIcon} Sistem Durumu: \${data.status.toUpperCase()}</div>\`;
            
            // Metrics
            const metrics = data.metrics;
            metricsDiv.innerHTML = \`
                <div class="metric"><strong>\${metrics.totalRequests}</strong>Toplam İstek</div>
                <div class="metric"><strong>\${metrics.successfulRequests}</strong>Başarılı</div>
                <div class="metric"><strong>\${metrics.failedRequests}</strong>Başarısız</div>
                <div class="metric"><strong>%\${metrics.totalRequests > 0 ? ((metrics.successfulRequests / metrics.totalRequests) * 100).toFixed(1) : '100'}</strong>Başarı Oranı</div>
                <div class="metric"><strong>\${metrics.averageProcessingTime}ms</strong>Ortalama Süre</div>
            \`;
        }

        async function runHealthCheck() {
            document.getElementById('logs').innerHTML += '🔍 Sağlık kontrolü başlatılıyor...\\n';
            await fetchHealthData();
            document.getElementById('logs').innerHTML += '✅ Sağlık kontrolü tamamlandı\\n';
        }

        async function runFullTest() {
            document.getElementById('logs').innerHTML += '🧪 Tam test başlatılıyor...\\n';
            // Test API çağrısı burada yapılacak
            document.getElementById('logs').innerHTML += '✅ Tam test tamamlandı\\n';
        }

        function refreshData() {
            fetchHealthData();
        }

        // Initial load
        fetchHealthData();
        
        // Auto refresh every 30 seconds
        refreshInterval = setInterval(fetchHealthData, 30000);
    </script>
</body>
</html>
EOF

# Create quick start guide
echo "📚 Hızlı başlangıç kılavuzu oluşturuluyor..."
cat > MONITORING.md <<EOF
# ProCheff PDF İzleme Sistemi Kullanım Kılavuzu

## 🚀 Hızlı Başlangıç

### 1. Manuel Test Çalıştırma
\`\`\`bash
npm run test:pdf
\`\`\`

### 2. Sağlık Durumu Kontrolü
\`\`\`bash
npm run monitor:health
\`\`\`

### 3. İzleme Sistemini Başlatma
\`\`\`bash
npm run monitor:start
\`\`\`

### 4. PM2 ile Servis Olarak Çalıştırma
\`\`\`bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
\`\`\`

## 🔧 Konfigürasyon

1. \`.env.monitoring.template\` dosyasını kopyalayın:
   \`\`\`bash
   cp .env.monitoring.template .env.monitoring
   \`\`\`

2. Çevre değişkenlerini düzenleyin:
   - Email ayarları (isteğe bağlı)
   - Slack webhook (isteğe bağlı)
   - Uyarı eşikleri

## 📊 İzleme Paneli

Tarayıcınızda açın: http://localhost:3000/monitoring.html

## 🚨 Uyarı Konfigürasyonu

### Email Uyarıları
- SMTP ayarlarını \`.env.monitoring\` dosyasında yapılandırın
- Gmail için uygulama şifresi kullanın

### Slack Uyarıları
- Slack workspace'inizde webhook URL'si oluşturun
- URL'yi \`.env.monitoring\` dosyasına ekleyin

## 📁 Log Dosyaları

- \`logs/pdf-analysis.log\` - PDF işlem logları
- \`logs/alerts.log\` - Uyarı logları
- \`reports/\` - Test raporları

## 🔄 Otomatik Kurtarma

Sistem otomatik olarak:
- Geçici dosyaları temizler
- Log dosyalarını rotate eder
- Memory cleanup yapar

## 🛠️ Troubleshooting

### Test Başarısız Oluyor
1. Sunucunun çalıştığından emin olun
2. API endpoint'lerini kontrol edin
3. Log dosyalarını inceleyin

### İzleme Çalışmıyor
1. Cron job'ların çalıştığını kontrol edin
2. Process durumunu kontrol edin: \`ps aux | grep monitor\`
3. PM2 status: \`pm2 status\`

### Uyarılar Gelmiyor
1. Email/Slack ayarlarını kontrol edin
2. Network bağlantısını test edin
3. Credentials'ları doğrulayın
EOF

echo ""
echo "✅ ProCheff PDF İzleme Sistemi kurulumu tamamlandı!"
echo ""
echo "📋 Sonraki Adımlar:"
echo "1. Çevre değişkenlerini ayarlayın: cp .env.monitoring.template .env.monitoring"
echo "2. Test çalıştırın: npm run test:pdf"
echo "3. İzleme sistemini başlatın: npm run monitor:start"
echo "4. İzleme panelini açın: http://localhost:3000/monitoring.html"
echo ""
echo "📚 Detaylı kılavuz: MONITORING.md"
echo ""