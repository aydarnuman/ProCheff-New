#!/usr/bin/env node
/**
 * ProCheff - Agent Kilit Mekanizması
 * Aynı dizinde eşzamanlı değişiklik yapmayı engeller
 */

const fs = require("fs");
const path = require("path");

function createLock(scopePath, owner, ttlMinutes = 120) {
  const locksDir = path.join(__dirname, "../locks");

  // locks dizini yoksa oluştur
  if (!fs.existsSync(locksDir)) {
    fs.mkdirSync(locksDir, { recursive: true });
  }

  // Path-safe dosya adı oluştur
  const safeFileName = scopePath
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/^_+|_+$/g, "");
  const lockFile = path.join(locksDir, `${safeFileName}.lock`);

  // Mevcut kilidi kontrol et
  if (fs.existsSync(lockFile)) {
    try {
      const existingLock = JSON.parse(fs.readFileSync(lockFile, "utf8"));
      const now = new Date();
      const lockTime = new Date(existingLock.createdAt);
      const ttlMs = existingLock.ttlMinutes * 60 * 1000;

      // TTL dolmuş mu kontrol et
      if (now - lockTime < ttlMs) {
        console.error(`❌ Kilit mevcut: ${scopePath}`);
        console.error(`   Sahibi: ${existingLock.owner}`);
        console.error(`   Oluşturulma: ${existingLock.createdAt}`);
        console.error(
          `   Kalan süre: ${Math.round(
            (ttlMs - (now - lockTime)) / 60000
          )} dakika`
        );
        process.exit(1);
      } else {
        console.log(`⏰ TTL dolmuş kilit temizleniyor: ${scopePath}`);
        fs.unlinkSync(lockFile);
      }
    } catch (error) {
      console.log(`🧹 Bozuk kilit dosyası temizleniyor: ${lockFile}`);
      fs.unlinkSync(lockFile);
    }
  }

  // Yeni kilit oluştur
  const lockData = {
    scopePath,
    owner,
    ttlMinutes,
    createdAt: new Date().toISOString(),
    pid: process.pid,
    hostname: require("os").hostname(),
  };

  fs.writeFileSync(lockFile, JSON.stringify(lockData, null, 2));

  console.log(`🔒 Kilit oluşturuldu: ${scopePath}`);
  console.log(`   Sahibi: ${owner}`);
  console.log(`   TTL: ${ttlMinutes} dakika`);
  console.log(`   Dosya: ${lockFile}`);
}

// CLI kullanımı
if (require.main === module) {
  const [, , scopePath, owner, ttlMinutes] = process.argv;

  if (!scopePath || !owner) {
    console.error(
      "Kullanım: node scripts/lock.js <scopePath> <owner> [ttlDakika=120]"
    );
    console.error("Örnek: node scripts/lock.js src/app/ihale procheff-ui 120");
    process.exit(1);
  }

  createLock(scopePath, owner, ttlMinutes ? parseInt(ttlMinutes) : 120);
}

module.exports = { createLock };
