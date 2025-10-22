// Vitest global test setup
import { afterAll, beforeAll, vi } from "vitest";
import { spawn, spawnSync, ChildProcess } from "child_process";

// JSDOM ya da fetch mock gibi globaller burada yapılandırılabilir
// Node 18+ ile global fetch mevcut; ilave polyfill gerekmiyor

// Next.js ortam değişkenlerinde test için defaultlar (readonly olabilir)
try {
  if (!process.env.NODE_ENV) {
    // @ts-expect-error bazı ortamlar readonly değil
    process.env.NODE_ENV = "test";
  }
} catch {
  // ignore if readonly
}

beforeAll(() => {
  // Gerekli ise saat/tarih sabitleme
  vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
});

afterAll(() => {
  vi.useRealTimers();
});

// --- E2E Test Server Bootstrap ---
// Otomatik olarak Next.js production server'ı testler başlamadan ayağa kaldırır
// ve bittiğinde kapatır. Böylece ECONNREFUSED hataları engellenir.

let serverStartedBySetup = false;
let devProc: ChildProcess | null = null;

async function ping(url: string, timeoutMs = 2000): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    return res.status < 500;
  } catch {
    return false;
  }
}

async function waitForServerReady(
  baseUrl: string,
  retries = 20,
  intervalMs = 500
) {
  for (let i = 0; i < retries; i++) {
    if (await ping(baseUrl)) return true;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

beforeAll(async () => {
  const baseUrl = "http://localhost:3000";
  const ready = await waitForServerReady(baseUrl);
  if (ready) {
    return; // Zaten çalışıyor
  }

  // 1) Daha hızlı: DEV server'ı başlatmayı dene
  try {
    devProc = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "dev"],
      {
        stdio: "pipe",
        env: {
          ...process.env,
          NODE_ENV: "development",
          NEXT_TELEMETRY_DISABLED: "1",
          PORT: "3000",
        },
      }
    );

    devProc.stdout?.on("data", (d) => {
      const s = d.toString();
      if (s.includes("Ready")) {
        // hint only
      }
    });
    devProc.stderr?.on("data", () => {});

    serverStartedBySetup = true;
    const okDev = await waitForServerReady(baseUrl, 60, 500);
    if (okDev) return;
  } catch {}

  // 2) Fallback: Production server'ı başlat (standalone)
  try {
    spawn("node", ["scripts/test-server-manager.js", "start"], {
      stdio: "inherit",
      env: { ...process.env, NODE_ENV: "production" },
    });
    serverStartedBySetup = true;

    const ok = await waitForServerReady(baseUrl, 30, 500);
    if (!ok) {
      throw new Error("Test server failed to become ready");
    }
  } catch {
    // Sessiz geç; unit testler çalışsın
  }
}, 120000); // build dahil 120s bütçe

afterAll(async () => {
  if (serverStartedBySetup) {
    try {
      if (devProc) {
        try {
          devProc.kill("SIGTERM");
        } catch {}
      } else {
        spawnSync("node", ["scripts/test-server-manager.js", "stop"], {
          stdio: "inherit",
        });
      }
    } catch {}
  }
});
