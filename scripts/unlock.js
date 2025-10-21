#!/usr/bin/env node
/**
 * ProCheff - Kilit Kaldırma Utility
 */

const fs = require("fs");
const path = require("path");

function removeLock(scopePath, owner) {
  const locksDir = path.join(__dirname, "../locks");
  const safeFileName = scopePath
    .replace(/[/\\:*?"<>|]/g, "_")
    .replace(/^_+|_+$/g, "");
  const lockFile = path.join(locksDir, `${safeFileName}.lock`);

  if (!fs.existsSync(lockFile)) {
    console.log(`ℹ️  Kilit bulunamadı: ${scopePath}`);
    return false;
  }

  try {
    const lockData = JSON.parse(fs.readFileSync(lockFile, "utf8"));

    // Owner kontrolü (eğer belirtilmişse)
    if (owner && lockData.owner !== owner) {
      console.error(`❌ Yetkisiz kilit kaldırma girişimi`);
      console.error(`   Kilit sahibi: ${lockData.owner}`);
      console.error(`   Talep eden: ${owner}`);
      return false;
    }

    fs.unlinkSync(lockFile);
    console.log(`🔓 Kilit kaldırıldı: ${scopePath}`);
    console.log(`   Önceki sahibi: ${lockData.owner}`);
    return true;
  } catch (error) {
    console.log(`🧹 Bozuk kilit dosyası temizleniyor: ${lockFile}`);
    fs.unlinkSync(lockFile);
    return true;
  }
}

// CLI kullanımı
if (require.main === module) {
  const [, , scopePath, owner] = process.argv;

  if (!scopePath) {
    console.error("Kullanım: node scripts/unlock.js <scopePath> [owner]");
    console.error("Örnek: node scripts/unlock.js src/app/ihale procheff-ui");
    process.exit(1);
  }

  const success = removeLock(scopePath, owner);
  process.exit(success ? 0 : 1);
}

module.exports = { removeLock };
