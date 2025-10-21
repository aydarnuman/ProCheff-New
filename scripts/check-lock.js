#!/usr/bin/env node
/**
 * ProCheff - Kilit Kontrol Utility
 * Dosyaları değiştirmeden önce kilit kontrolü yapar
 */

const fs = require("fs");
const path = require("path");

function checkLocks(filePaths) {
  const locksDir = path.join(__dirname, "../locks");
  const conflicts = [];

  if (!fs.existsSync(locksDir)) {
    return { success: true, conflicts: [] };
  }

  // Her dosya yolu için kilitli kapsamları kontrol et
  for (const filePath of filePaths) {
    const normalizedPath = path.normalize(filePath);

    // Tüm kilit dosyalarını kontrol et
    const lockFiles = fs
      .readdirSync(locksDir)
      .filter((f) => f.endsWith(".lock"));

    for (const lockFile of lockFiles) {
      try {
        const lockData = JSON.parse(
          fs.readFileSync(path.join(locksDir, lockFile), "utf8")
        );

        // TTL kontrolü
        const now = new Date();
        const lockTime = new Date(lockData.createdAt);
        const ttlMs = lockData.ttlMinutes * 60 * 1000;

        if (now - lockTime >= ttlMs) {
          console.log(
            `⏰ TTL dolmuş kilit temizleniyor: ${lockData.scopePath}`
          );
          fs.unlinkSync(path.join(locksDir, lockFile));
          continue;
        }

        // Kapsam çakışması kontrolü
        const lockScope = path.normalize(lockData.scopePath);

        if (
          normalizedPath.startsWith(lockScope) ||
          lockScope.startsWith(normalizedPath)
        ) {
          conflicts.push({
            filePath: normalizedPath,
            lockScope: lockScope,
            owner: lockData.owner,
            createdAt: lockData.createdAt,
            remainingMinutes: Math.round((ttlMs - (now - lockTime)) / 60000),
          });
        }
      } catch (error) {
        console.log(`🧹 Bozuk kilit dosyası temizleniyor: ${lockFile}`);
        fs.unlinkSync(path.join(locksDir, lockFile));
      }
    }
  }

  return {
    success: conflicts.length === 0,
    conflicts,
  };
}

// CLI kullanımı
if (require.main === module) {
  const filePaths = process.argv.slice(2);

  if (filePaths.length === 0) {
    console.error("Kullanım: node scripts/check-lock.js <dosya1> <dosya2> ...");
    console.error(
      "Örnek: node scripts/check-lock.js src/app/ihale/page.tsx src/components/ihale/form.tsx"
    );
    process.exit(1);
  }

  const result = checkLocks(filePaths);

  if (result.success) {
    console.log("✅ Tüm dosyalar kilit kontrolünden geçti");
    process.exit(0);
  } else {
    console.error("❌ Kilit çakışması tespit edildi:");
    for (const conflict of result.conflicts) {
      console.error(`   Dosya: ${conflict.filePath}`);
      console.error(`   Kilitli kapsam: ${conflict.lockScope}`);
      console.error(`   Sahibi: ${conflict.owner}`);
      console.error(`   Kalan süre: ${conflict.remainingMinutes} dakika`);
      console.error("");
    }
    process.exit(1);
  }
}

module.exports = { checkLocks };
