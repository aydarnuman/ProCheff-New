#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');

// ProCheff Development Monitor
class ProCheffMonitor {
  constructor() {
    this.isRunning = false;
    this.stats = {
      requests: 0,
      errors: 0,
      lastActivity: new Date(),
      uptime: Date.now()
    };
  }

  async checkHealth() {
    return new Promise((resolve) => {
      const curl = spawn('curl', ['-s', '-f', 'http://localhost:3000/api/health']);
      
      curl.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }

  async checkDisk() {
    return new Promise((resolve) => {
      const du = spawn('du', ['-sh', '.next', 'node_modules']);
      let output = '';
      
      du.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      du.on('close', () => {
        resolve(output.trim());
      });
    });
  }

  async getMemoryUsage() {
    return new Promise((resolve) => {
      const ps = spawn('ps', ['-o', 'pid,ppid,%mem,%cpu,command', '-p', process.pid]);
      let output = '';
      
      ps.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      ps.on('close', () => {
        resolve(output.trim());
      });
    });
  }

  logStatus(status, message) {
    const timestamp = new Date().toLocaleTimeString();
    const emoji = status === 'success' ? '✅' : status === 'warning' ? '⚠️' : '❌';
    console.log(`[${timestamp}] ${emoji} ${message}`);
  }

  async monitor() {
    console.log('🔍 ProCheff Development Monitor Started');
    console.log('=====================================\n');

    setInterval(async () => {
      const health = await this.checkHealth();
      
      if (health) {
        this.logStatus('success', 'Server is healthy');
        this.stats.requests++;
      } else {
        this.logStatus('error', 'Server health check failed');
        this.stats.errors++;
      }

      // Check every 30 seconds
    }, 30000);

    // Disk usage check every 5 minutes
    setInterval(async () => {
      const diskUsage = await this.checkDisk();
      this.logStatus('info', `Disk usage:\n${diskUsage}`);
    }, 300000);

    // Memory check every minute
    setInterval(async () => {
      const memUsage = await this.getMemoryUsage();
      console.log(`💾 Memory: ${memUsage.split('\n')[1]}`);
    }, 60000);

    // Show stats every 10 minutes
    setInterval(() => {
      const uptime = Math.floor((Date.now() - this.stats.uptime) / 1000 / 60);
      console.log(`\n📊 Stats (${uptime}m uptime):`);
      console.log(`   Requests: ${this.stats.requests}`);
      console.log(`   Errors: ${this.stats.errors}`);
      console.log(`   Success Rate: ${((this.stats.requests - this.stats.errors) / this.stats.requests * 100).toFixed(1)}%`);
      console.log('');
    }, 600000);

    // File watcher for important files
    const watchFiles = [
      'package.json',
      '.env.local',
      'next.config.js',
      'tailwind.config.js'
    ];

    watchFiles.forEach(file => {
      if (fs.existsSync(file)) {
        fs.watchFile(file, (curr, prev) => {
          this.logStatus('warning', `File changed: ${file} - Consider restart`);
        });
      }
    });

    this.logStatus('success', 'Monitor setup complete. Press Ctrl+C to stop.');
  }

  stop() {
    console.log('\n🛑 Monitor stopped');
    process.exit(0);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  monitor.stop();
});

const monitor = new ProCheffMonitor();
monitor.monitor();
