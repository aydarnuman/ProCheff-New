#!/usr/bin/env node

/**
 * Quick Local Preview - DEV Mode (Fast Version)
 * Hızlı dev server başlatır, uzun sürede kalmasın
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class QuickLocalPreview {
  constructor() {
    this.devProcess = null;
    this.port = 3000;
    this.stateFile = path.join(__dirname, '../reports/quick-preview-state.json');
  }

  async startQuickPreview() {
    console.log('⚡ Quick Local Preview başlatılıyor...\n');
    
    const state = {
      preview_mode: 'dev',
      port_conflict: false,
      health_wait: 'unknown',
      server_lifecycle: 'unknown',
      timestamp: new Date().toISOString()
    };

    try {
      // 1. Hızlı temizlik
      console.log('🧹 Process temizliği...');
      this.quickCleanup();
      state.server_lifecycle = 'clean';

      // 2. Port kontrolü
      console.log('📡 Port kontrolü...');
      if (this.isPortBusy()) {
        console.error('❌ Port 3000 meşgul!');
        state.port_conflict = true;
        throw new Error('Port conflict');
      }
      state.port_conflict = false;

      // 3. Dev server başlat (background)
      console.log('🚀 Dev server başlatılıyor...');
      this.startDevBackground();

      // 4. Kısa health check
      console.log('⏳ Server hazır olması bekleniyor...');
      const healthOk = await this.quickHealthCheck();
      state.health_wait = healthOk ? 'ok' : 'timeout';

      if (healthOk) {
        console.log('✅ Dev server hazır!');
        console.log('🌐 Panel: http://localhost:3000');
        
        // VS Code panel açmayı dene
        this.tryOpenPanel();
        
        console.log('\n🎉 Quick Preview başarıyla başlatıldı!');
        console.log('📋 Durumdur: preview_mode=dev, port_conflict=false, health_wait=ok');
        console.log('🛑 Durdurmak için: npm run preview:stop');
      } else {
        throw new Error('Health check timeout');
      }

      // State kaydet
      this.saveState(state);
      return state;

    } catch (error) {
      console.error('❌ Hata:', error.message);
      state.error = error.message;
      this.saveState(state);
      throw error;
    }
  }

  quickCleanup() {
    try {
      execSync('pkill -f "next.*dev" 2>/dev/null || true', { stdio: 'ignore' });
      execSync(`lsof -ti:${this.port} | xargs kill -9 2>/dev/null || true`, { stdio: 'ignore' });
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  isPortBusy() {
    try {
      execSync(`lsof -i :${this.port}`, { stdio: 'ignore' });
      return true;
    } catch (e) {
      return false;
    }
  }

  startDevBackground() {
    // Dev server'ı detached mode'da başlat
    this.devProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'ignore', // Output'u ignore et, hızlı olsun
      detached: true,
      env: {
        ...process.env,
        PORT: this.port.toString(),
        NODE_ENV: 'development'
      }
    });

    // Process'i parent'tan ayır
    this.devProcess.unref();
  }

  async quickHealthCheck() {
    const maxRetries = 8; // Reduced from 15
    const interval = 750; // Reduced from 1000ms
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(`http://localhost:${this.port}/`, {
          signal: AbortSignal.timeout(2000)
        });
        
        if (response.status < 500) {
          return true;
        }
      } catch (error) {
        // Retry
      }
      
      await this.sleep(interval);
    }
    
    return false;
  }

  tryOpenPanel() {
    try {
      // VS Code Simple Browser açmayı dene
      execSync(`code --command "simpleBrowser.show" "${`http://localhost:${this.port}`}"`, {
        stdio: 'ignore',
        timeout: 2000
      });
      console.log('📱 VS Code panel açıldı');
    } catch (error) {
      console.log('⚠️  VS Code panel açılamadı, tarayıcıyı manuel açın');
    }
  }

  async stopQuickPreview() {
    console.log('🛑 Quick preview durduruluyor...');
    
    try {
      // Tüm dev server'ları kapat
      execSync('pkill -f "next.*dev"', { stdio: 'ignore' });
      
      // Port temizle
      execSync(`lsof -ti:${this.port} | xargs kill -9`, { stdio: 'ignore' });
      
      console.log('✅ Preview durduruldu');
      
      // State güncelle  
      const state = {
        preview_mode: 'stopped',
        server_lifecycle: 'stopped',
        timestamp: new Date().toISOString()
      };
      this.saveState(state);
      
    } catch (error) {
      console.log('⚠️  Stop sırasında uyarı:', error.message);
    }
  }

  saveState(state) {
    const reportsDir = path.dirname(this.stateFile);
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  const preview = new QuickLocalPreview();

  if (command === 'start') {
    preview.startQuickPreview()
      .then(() => {
        console.log('\n✅ Başlatma tamamlandı - server background\'da çalışıyor');
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Başlatma başarısız:', error.message);
        process.exit(1);
      });
  } else if (command === 'stop') {
    preview.stopQuickPreview()
      .then(() => {
        process.exit(0);
      })
      .catch(error => {
        console.error('❌ Durdurma hatası:', error.message);
        process.exit(1);
      });
  } else {
    console.log('Kullanım:');
    console.log('  node quick-local-preview.js start  # Hızlı dev preview başlat');
    console.log('  node quick-local-preview.js stop   # Dev preview durdur');
    process.exit(1);
  }
}

module.exports = QuickLocalPreview;
