#!/usr/bin/env node

/**
 * Test Server Manager
 * Integration testleri için production mode server yönetimi
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestServerManager {
  constructor() {
    this.serverProcess = null;
    this.port = 3000;
    this.healthCheckRetries = 10; // Further reduced for faster testing
    this.healthCheckInterval = 500; // 0.5 second
    this.serverStartTimeout = 15000; // Reduced to 15 seconds
  }

  async findAvailablePort(startPort = 3000) {
    const { execSync } = require('child_process');
    
    for (let port = startPort; port <= startPort + 10; port++) {
      try {
        execSync(`lsof -i :${port}`, { stdio: 'ignore' });
        // Port kullanımda, devam et
      } catch (error) {
        // Port boş, kullan
        return port;
      }
    }
    
    throw new Error('No available ports found');
  }

  async killAllNextProcesses() {
    console.log('🧹 Cleaning up existing Next.js processes...');
    
    try {
      execSync('pkill -f "next"', { stdio: 'ignore' });
      await this.sleep(2000); // 2 saniye bekle
      console.log('✅ Process cleanup completed');
    } catch (error) {
      // Hiç process yoksa hata vermez
      console.log('ℹ️  No existing processes to clean');
    }
  }

  async startProductionServer() {
    console.log('🚀 Starting production server...');
    
    // 1. Önce build yap
    console.log('🔨 Building application...');
    try {
      execSync('npm run build', { 
        stdio: 'pipe',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Build completed');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }

    // 2. Available port bul
    this.port = await this.findAvailablePort();
    console.log(`📡 Using port: ${this.port}`);

    // 3. Production server başlat
    console.log('🎯 Starting production server...');
    
    const env = {
      ...process.env,
      PORT: this.port.toString(),
      NODE_ENV: 'production',
      NEXT_PUBLIC_DISABLE_AUTH: 'true'
    };

    // Standalone server kullan
    const serverPath = path.join(__dirname, '../.next/standalone/server.js');
    
    this.serverProcess = spawn('node', [serverPath], {
      env,
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });

    // 4. Server output'unu logla
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('📄 Server output:', output.trim());
      if (output.includes('Ready') || output.includes('started') || output.includes('listening')) {
        console.log('✅ Production server ready signal detected');
      }
    });

    this.serverProcess.stderr.on('data', (data) => {
      console.error('❌ Server error:', data.toString());
    });

    // 5. Health check bekle
    await this.waitForServerReady();
    
    return {
      port: this.port,
      baseUrl: `http://localhost:${this.port}`,
      mode: 'production'
    };
  }

  async waitForServerReady() {
    console.log('⏳ Waiting for server to be ready...');
    
    const startTime = Date.now();
    
    for (let i = 0; i < this.healthCheckRetries; i++) {
      try {
        // Try simple root page first, then health-test
        const response = await fetch(`http://localhost:${this.port}/`, {
          signal: AbortSignal.timeout(3000)
        });
        
        if (response.status < 500) { // Accept any non-server error
          const elapsedTime = Date.now() - startTime;
          console.log(`✅ Server ready after ${elapsedTime}ms (status: ${response.status})`);
          
          return {
            health_wait: 'ok',
            port_conflict: false,
            ready_time_ms: elapsedTime
          };
        }
      } catch (error) {
        console.log(`⏳ Retry ${i+1}/${this.healthCheckRetries} - ${error.message}`);
      }
      
      await this.sleep(this.healthCheckInterval);
    }
    
    throw new Error('Server failed to become ready within timeout');
  }

  async stopServer() {
    console.log('🛑 Stopping production server...');
    
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
      
      // Graceful shutdown bekle
      await this.sleep(3000);
      
      // Force kill if still running
      if (!this.serverProcess.killed) {
        this.serverProcess.kill('SIGKILL');
      }
      
      this.serverProcess = null;
    }

    // Tüm Next.js process'lerini temizle
    await this.killAllNextProcesses();
    
    // Port kontrolü
    const portClean = await this.verifyPortClean();
    
    console.log('✅ Server stopped and cleaned');
    
    return {
      server_lifecycle: 'clean',
      port_clean: portClean,
      zombie_processes: await this.checkZombieProcesses()
    };
  }

  async verifyPortClean() {
    try {
      execSync(`lsof -i :${this.port}`, { stdio: 'ignore' });
      return false; // Port hala kullanımda
    } catch (error) {
      return true; // Port temiz
    }
  }

  async checkZombieProcesses() {
    try {
      const output = execSync('ps aux | grep "next" | grep -v grep', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const processCount = output.trim().split('\n').filter(line => line.length > 0).length;
      return processCount === 0 ? 'clean' : `${processCount} processes found`;
    } catch (error) {
      return 'clean'; // Hiç process yok
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getServerInfo() {
    return {
      port: this.port,
      baseUrl: `http://localhost:${this.port}`,
      mode: 'production',
      running: this.serverProcess !== null
    };
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  const manager = new TestServerManager();
  
  async function main() {
    try {
      switch (command) {
        case 'start':
          const serverInfo = await manager.startProductionServer();
          console.log('📊 Server Info:', JSON.stringify(serverInfo, null, 2));
          break;
          
        case 'stop':
          const stopInfo = await manager.stopServer();
          console.log('📊 Stop Info:', JSON.stringify(stopInfo, null, 2));
          break;
          
        case 'status':
          const statusInfo = manager.getServerInfo();
          console.log('📊 Status Info:', JSON.stringify(statusInfo, null, 2));
          break;
          
        case 'cleanup':
          await manager.killAllNextProcesses();
          console.log('✅ Cleanup completed');
          break;
          
        default:
          console.log('Usage: node test-server-manager.js [start|stop|status|cleanup]');
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  }
  
  main();
}

module.exports = TestServerManager;
