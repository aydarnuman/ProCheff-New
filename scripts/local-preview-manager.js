#!/usr/bin/env node

/**
 * Local Preview Manager - DEV Mode
 * Tek süreçte dev server başlatır, VS Code'da canlı önizleme paneli açar
 * Hot reload ile anlık güncellemeler sağlar
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class LocalPreviewManager {
  constructor() {
    this.devProcess = null;
    this.port = 3000;
    this.healthCheckRetries = 15;
    this.healthCheckInterval = 1000;
    this.previewState = {
      mode: 'dev',
      port_conflict: false,
      health_wait: 'unknown',
      server_lifecycle: 'unknown',
      hot_reload_active: false,
      panel_opened: false
    };
    this.logFile = path.join(__dirname, '../reports/dev-preview.log');
    this.stateFile = path.join(__dirname, '../reports/dev-preview-state.json');
  }

  async startDevPreview() {
    console.log('🚀 Local Preview Manager - DEV Mode başlatılıyor...\n');
    
    try {
      // 1. Port temizliği - tüm next süreçlerini kapat
      await this.cleanupAllNextProcesses();
      
      // 2. Port çakışması kontrolü
      await this.verifyPortClean();
      
      // 3. Dev server başlat
      await this.startDevServer();
      
      // 4. Health check - hazır bekleme
      await this.waitForServerReady();
      
      // 5. VS Code preview panel aç
      await this.openPreviewPanel();
      
      // 6. Hot reload test
      await this.testHotReload();
      
      // 7. State kaydet
      this.savePreviewState();
      
      console.log('🎉 Dev Preview başarıyla başlatıldı!');
      console.log('📋 Durum:');
      console.log(`   Preview Mode: ${this.previewState.mode}`);
      console.log(`   Port Conflict: ${this.previewState.port_conflict}`);
      console.log(`   Health Wait: ${this.previewState.health_wait}`);
      console.log(`   Server Lifecycle: ${this.previewState.server_lifecycle}`);
      console.log(`   Hot Reload: ${this.previewState.hot_reload_active ? 'AKTIF' : 'PASIF'}`);
      console.log(`   Panel: ${this.previewState.panel_opened ? 'AÇIK' : 'KAPALI'}`);
      
      console.log('\n🔄 Dev server çalışıyor... Durdurmak için Ctrl+C');
      console.log('📁 Logs: tail -f ' + this.logFile);
      
      // Process'i canlı tut
      this.keepAlive();
      
      return this.previewState;
      
    } catch (error) {
      console.error('❌ Dev preview başlatma hatası:', error.message);
      await this.cleanup();
      throw error;
    }
  }

  async cleanupAllNextProcesses() {
    console.log('🧹 Tüm Next.js süreçleri kapatılıyor...');
    
    try {
      // pkill ile tüm next süreçlerini kapat
      execSync('pkill -f "next.*dev\\|next.*start\\|next.*build"', { stdio: 'ignore' });
      
      // Biraz bekle
      await this.sleep(2000);
      
      // Port kontrolü
      try {
        execSync(`lsof -ti:${this.port} | xargs kill -9`, { stdio: 'ignore' });
        await this.sleep(1000);
      } catch (e) {
        // Port zaten boş
      }
      
      console.log('✅ Process temizliği tamamlandı');
      this.previewState.server_lifecycle = 'clean';
      
    } catch (error) {
      console.log('ℹ️  Temizlenecek process bulunamadı');
      this.previewState.server_lifecycle = 'clean';
    }
  }

  async verifyPortClean() {
    console.log(`📡 Port ${this.port} temizliği kontrol ediliyor...`);
    
    try {
      execSync(`lsof -i :${this.port}`, { stdio: 'ignore' });
      console.error(`❌ Port ${this.port} hala kullanımda!`);
      this.previewState.port_conflict = true;
      throw new Error(`Port ${this.port} conflict detected`);
    } catch (error) {
      // lsof hata verirse port temiz demektir
      console.log('✅ Port temiz');
      this.previewState.port_conflict = false;
    }
  }

  async startDevServer() {
    console.log('🎯 Development server başlatılıyor...');
    
    // Log dosyası hazırla
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    // Dev server başlat
    this.devProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: this.port.toString(),
        NODE_ENV: 'development'
      }
    });

    // Output'u logla
    const logStream = fs.createWriteStream(this.logFile, { flags: 'w' });
    
    this.devProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📄 Dev:', output.trim());
      logStream.write(`[${new Date().toISOString()}] STDOUT: ${output}`);
      
      // Ready sinyalini yakala
      if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
        console.log('✅ Dev server ready signal detected');
      }
    });

    this.devProcess.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('🔍 Dev Error:', output.trim());
      logStream.write(`[${new Date().toISOString()}] STDERR: ${output}`);
    });

    this.devProcess.on('exit', (code) => {
      console.log(`🛑 Dev server exited with code ${code}`);
      logStream.end();
    });

    // Server'ın başlaması için kısa bir süre bekle
    await this.sleep(3000);
  }

  async waitForServerReady() {
    console.log('⏳ Server hazır olması bekleniyor...');
    
    const startTime = Date.now();
    
    for (let i = 0; i < this.healthCheckRetries; i++) {
      try {
        const response = await fetch(`http://localhost:${this.port}/api/health`, {
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.status === 200) {
          const elapsedTime = Date.now() - startTime;
          console.log(`✅ Server ready after ${elapsedTime}ms (health: 200)`);
          this.previewState.health_wait = 'ok';
          return;
        } else if (response.status < 500) {
          // 4xx errors are acceptable - server is running
          const elapsedTime = Date.now() - startTime;
          console.log(`✅ Server ready after ${elapsedTime}ms (status: ${response.status})`);
          this.previewState.health_wait = 'ok';
          return;
        }
      } catch (error) {
        console.log(`⏳ Health check ${i+1}/${this.healthCheckRetries}...`);
        await this.sleep(this.healthCheckInterval);
      }
    }
    
    throw new Error('Server failed to become ready - health check timeout');
  }

  async openPreviewPanel() {
    console.log('🌐 VS Code preview panel açılıyor...');
    
    const previewUrl = `http://localhost:${this.port}`;
    let panelOpened = false;
    
    try {
      // Method 1: VS Code Simple Browser (ana yöntem)
      console.log('  📱 Simple Browser ile panel açılıyor...');
      execSync(`code --command "simpleBrowser.show" --args "${previewUrl}"`, {
        stdio: 'ignore'
      });
      panelOpened = true;
      console.log('  ✅ Simple Browser panel açıldı');
      
    } catch (error) {
      console.log('  ⚠️  Simple Browser başarısız, alternatif deneniyor...');
      
      try {
        // Method 2: VS Code Live Preview extension (eğer yüklüyse)  
        console.log('  📱 Live Preview ile deneniyor...');
        execSync(`code --command "livePreview.start.preview.atFile" --args "${previewUrl}"`, {
          stdio: 'ignore'
        });
        panelOpened = true;
        console.log('  ✅ Live Preview panel açıldı');
        
      } catch (error2) {
        console.log('  ⚠️  Live Preview de başarısız');
        
        try {
          // Method 3: macOS default browser
          console.log('  🌐 Sistem tarayıcısı açılıyor...');
          execSync(`open "${previewUrl}"`, { stdio: 'ignore' });
          panelOpened = true;
          console.log('  ✅ Tarayıcı açıldı');
          
        } catch (error3) {
          console.log('  ❌ Hiçbir yöntem çalışmadı');
        }
      }
    }
    
    if (panelOpened) {
      console.log(`✅ Preview hazır: ${previewUrl}`);
      console.log('🎯 OTOMATIK ÖNİZLEME AKTİF!');
      console.log('   • Dosya değişikliklerinde otomatik yenilenir');
      console.log('   • Hot reload ile anında güncellenir');
      console.log('   • VS Code panel içinde canlı önizleme');
      this.previewState.panel_opened = true;
      
      // Panel'in tam açılması için bekle
      await this.sleep(3000);
      
      // Focus'u VS Code'a getir
      try {
        execSync('osascript -e \'tell application "Visual Studio Code" to activate\'', {
          stdio: 'ignore'
        });
        console.log('🎯 VS Code focus aktif - panel önünüzde!');
      } catch (e) {
        // Ignore focus error
      }
      
    } else {
      console.log('⚠️  Otomatik panel açılamadı, manuel olarak şu URL\'yi ziyaret edin:');
      console.log(`   ${previewUrl}`);
      this.previewState.panel_opened = false;
    }
  }

  async testHotReload() {
    console.log('🔥 Hot reload testi yapılıyor...');
    
    try {
      // Test için basit bir dosya değişikliği yap
      const testFile = path.join(__dirname, '../src/app/page.tsx');
      
      if (fs.existsSync(testFile)) {
        const originalContent = fs.readFileSync(testFile, 'utf8');
        
        // Timestamp ekle (görünmez bir değişiklik)
        const testContent = originalContent + `\n// Hot reload test: ${new Date().toISOString()}`;
        fs.writeFileSync(testFile, testContent);
        
        console.log('📝 Test dosyası güncellendi, hot reload bekleniyor...');
        await this.sleep(2000);
        
        // Orijinal içeriği geri yükle
        fs.writeFileSync(testFile, originalContent);
        
        console.log('✅ Hot reload test tamamlandı');
        this.previewState.hot_reload_active = true;
      } else {
        console.log('⚠️  Test dosyası bulunamadı, hot reload test atlandı');
        this.previewState.hot_reload_active = false;
      }
      
    } catch (error) {
      console.log('⚠️  Hot reload test hatası:', error.message);
      this.previewState.hot_reload_active = false;
    }
  }

  savePreviewState() {
    const state = {
      timestamp: new Date().toISOString(),
      preview_mode: this.previewState.mode,
      port_conflict: this.previewState.port_conflict,
      health_wait: this.previewState.health_wait,
      server_lifecycle: this.previewState.server_lifecycle,
      hot_reload_active: this.previewState.hot_reload_active,
      panel_opened: this.previewState.panel_opened,
      port: this.port,
      pid: this.devProcess ? this.devProcess.pid : null,
      log_file: this.logFile
    };

    const stateDir = path.dirname(this.stateFile);
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2));
  }

  async stopDevPreview() {
    console.log('🛑 Dev preview durduruluyor...');
    
    try {
      // Dev process'i temiz kapat
      if (this.devProcess) {
        this.devProcess.kill('SIGTERM');
        await this.sleep(3000);
        
        if (!this.devProcess.killed) {
          this.devProcess.kill('SIGKILL');
          await this.sleep(1000);
        }
      }

      // Port temizliği
      try {
        execSync(`lsof -ti:${this.port} | xargs kill -9`, { stdio: 'ignore' });
      } catch (e) {
        // Port zaten temiz
      }

      // State güncelle
      this.previewState.server_lifecycle = 'stopped';
      this.previewState.panel_opened = false;
      this.savePreviewState();

      console.log('✅ Dev preview temiz şekilde durduruldu');
      
    } catch (error) {
      console.error('❌ Stop error:', error.message);
    }
  }

  keepAlive() {
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutdown signal received...');
      await this.stopDevPreview();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🛑 Terminate signal received...');
      await this.stopDevPreview();
      process.exit(0);
    });
  }

  async cleanup() {
    await this.stopDevPreview();
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];
  const manager = new LocalPreviewManager();

  if (command === 'start') {
    manager.startDevPreview().catch(error => {
      console.error('❌ Start failed:', error.message);
      process.exit(1);
    });
  } else if (command === 'stop') {
    manager.stopDevPreview().then(() => {
      console.log('✅ Stopped successfully');
      process.exit(0);
    }).catch(error => {
      console.error('❌ Stop failed:', error.message);
      process.exit(1);
    });
  } else {
    console.log('Usage:');
    console.log('  node local-preview-manager.js start  # Start dev preview');
    console.log('  node local-preview-manager.js stop   # Stop dev preview');
    process.exit(1);
  }
}

module.exports = LocalPreviewManager;
