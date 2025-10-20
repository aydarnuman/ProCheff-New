#!/usr/bin/env node

async function request(path) {
  const url = `http://localhost:3000${path}`;
  const res = await fetch(url);
  const text = await res.text();
  console.log(`SMOKE ${path} → ${res.status}`);
  console.log(text.slice(0, 120));
  console.log();
}

(async () => {
  try {
    await request('/api/analyze-pdf');
  } catch (error) {
    console.error('Smoke failed', error);
    process.exit(1);
  }
})();
